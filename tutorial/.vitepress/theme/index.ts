import DefaultTheme from 'vitepress/theme'
import { inBrowser, useRoute } from 'vitepress'
import { h, watchEffect, nextTick } from 'vue'
import './simulator.css'

function Busuanzi() {
  return h('div', { class: 'busuanzi-footer' }, [
    h('span', { id: 'busuanzi_container_site_pv' }, [
      '本站总访问量 ',
      h('span', { id: 'busuanzi_value_site_pv' }),
      ' 次',
    ]),
    h('span', ' | '),
    h('span', { id: 'busuanzi_container_page_pv' }, [
      '本页访问量 ',
      h('span', { id: 'busuanzi_value_page_pv' }),
      ' 次',
    ]),
  ])
}

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-footer-before': () => h(Busuanzi),
    })
  },
  enhanceApp() {
    if (inBrowser) {
      const script = document.createElement('script')
      script.async = true
      script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
      document.head.appendChild(script)
    }
  },
}
