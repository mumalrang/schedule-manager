// ── Brain Dump 파서 ─────────────────────────────────────────
// 입력 예: "디자인 시안 검토 #개발 ~2h !긴급 내일 14:00"

const RELATIVE_DATES = { '어제': -1, '오늘': 0, '내일': 1, '모레': 2 }

function padTime(t) {
  const [h, m] = t.split(':')
  return `${String(h).padStart(2, '0')}:${m}`
}

function offsetDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

/**
 * @param {string} input  - raw user input
 * @param {Array}  projects - store projects array
 * @returns {{ text, projId, date, startTime, endTime, duration, urgent }}
 */
export function parseDump(input, projects = []) {
  let rest = input
  const meta = {}

  // 1. Project: #단어 → 프로젝트명 fuzzy match
  const hashMatch = rest.match(/#(\S+)/)
  if (hashMatch) {
    const q = hashMatch[1].toLowerCase()
    const proj = projects.find(p => {
      const n = p.name.toLowerCase()
      return n === q || n.includes(q) || q.includes(n.split(' ')[0])
    })
    if (proj) meta.projId = proj.id
    meta.projTag = hashMatch[1]   // 원본 태그 (칩 표시용)
    rest = rest.replace(hashMatch[0], '')
  }

  // 2. Duration: ~1h / ~30m / ~1h30m / ~90m / ~2시간 / ~30분
  const durMatch = rest.match(/~(\d+h\d+m|\d+h\d+분|\d+시간\d+분|\d+h|\d+m|\d+시간|\d+분)/)
  if (durMatch) {
    const raw = durMatch[1]
    let mins = 0
    const h  = raw.match(/(\d+)h/)
    const m  = raw.match(/(\d+)m/)
    const 시 = raw.match(/(\d+)시간/)
    const 분 = raw.match(/(\d+)분/)
    if (h)  mins += parseInt(h[1])  * 60
    if (m)  mins += parseInt(m[1])
    if (시) mins += parseInt(시[1]) * 60
    if (분) mins += parseInt(분[1])
    if (mins > 0) meta.duration = mins
    rest = rest.replace(durMatch[0], '')
  }

  // 3. Urgent: !긴급 or !urgent
  if (/!긴급|!urgent/i.test(rest)) {
    meta.urgent = true
    rest = rest.replace(/!긴급|!urgent/gi, '')
  }

  // 4. Date — 상대어 우선, 그다음 M/D 형식
  let foundDate = false
  for (const [word, offset] of Object.entries(RELATIVE_DATES)) {
    if (rest.includes(word)) {
      meta.date = offsetDate(offset)
      rest = rest.replace(word, '')
      foundDate = true
      break
    }
  }
  if (!foundDate) {
    const mdMatch = rest.match(/(\d{1,2})\/(\d{1,2})/)
    if (mdMatch) {
      const y = new Date().getFullYear()
      meta.date = `${y}-${String(mdMatch[1]).padStart(2,'0')}-${String(mdMatch[2]).padStart(2,'0')}`
      rest = rest.replace(mdMatch[0], '')
    }
  }

  // 5. Time: HH:MM-HH:MM 또는 HH:MM
  const timeRangeMatch = rest.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/)
  if (timeRangeMatch) {
    meta.startTime = padTime(timeRangeMatch[1])
    meta.endTime   = padTime(timeRangeMatch[2])
    rest = rest.replace(timeRangeMatch[0], '')
    if (!meta.date) meta.date = offsetDate(0)
  } else {
    const timeMatch = rest.match(/(\d{1,2}:\d{2})/)
    if (timeMatch) {
      meta.startTime = padTime(timeMatch[1])
      // duration 있으면 endTime 자동 계산
      if (meta.duration) {
        const [h, m] = meta.startTime.split(':').map(Number)
        const end = h * 60 + m + meta.duration
        meta.endTime = `${String(Math.floor(end / 60)).padStart(2,'0')}:${String(end % 60).padStart(2,'0')}`
      }
      rest = rest.replace(timeMatch[0], '')
      if (!meta.date) meta.date = offsetDate(0)
    }
  }

  // 정제된 텍스트
  meta.text = rest.replace(/\s+/g, ' ').trim()

  return meta
}

/** duration(분) → 표시 문자열 */
export function formatDuration(mins) {
  if (!mins) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h${m > 0 ? `${m}m` : ''}` : `${m}m`
}
