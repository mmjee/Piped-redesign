import DOMPurify from 'dompurify'

import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US')

class LibPiped {
  intlDTF = new Intl.DateTimeFormat([], {
    dateStyle: 'full',
    timeStyle: 'full'
  })

  timeFormat (duration) {
    const pad = function (num, size) {
      return ('000' + num).slice(size * -1)
    }

    const time = parseFloat(duration).toFixed(3)
    const hours = Math.floor(time / 60 / 60)
    const minutes = Math.floor(time / 60) % 60
    const seconds = Math.floor(time - minutes * 60)

    let str = ''

    if (hours > 0) str += hours + ':'

    str += pad(minutes, 2) + ':' + pad(seconds, 2)

    return str
  }

  formatFullDate (date) {
    return this.intlDTF.format(date)
  }

  numberFormat (num) {
    const digits = 2
    const si = [
      { value: 1, symbol: '' },
      { value: 1e3, symbol: 'K' },
      { value: 1e6, symbol: 'M' },
      { value: 1e9, symbol: 'B' }
    ]
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/
    let i
    for (i = si.length - 1; i > 0; i--) {
      if (num >= si[i].value) {
        break
      }
    }
    return (num / si[i].value).toFixed(digits).replace(rx, '$1') + si[i].symbol
  }

  addCommas (num) {
    num = parseInt(num)
    return num.toLocaleString('en-US')
  }

  purifyHTML (original) {
    return DOMPurify.sanitize(original)
  }

  timeAgo (time) {
    return timeAgo.format(time)
  }
}

const lp = new LibPiped()
export { lp as LibPiped }
