#!/usr/bin/env node
// scenes.json を HTML に埋め込んで ui/index.html を作る。
// 埋め込むのは、外から（GitHub Pages / スマホ）開いたときに fetch が効かないため。
import { readFileSync, writeFileSync } from 'node:fs'
const here = (p) => new URL(p, import.meta.url)
const tpl = readFileSync(here('./index.template.html'), 'utf8')
const data = readFileSync(here('./scenes.json'), 'utf8')
writeFileSync(here('./index.html'), tpl.replace('/*__SCENES__*/ null', data.trim()))
console.log('ui/index.html を作った', (data.length / 1024).toFixed(0) + 'KB 分のデータを埋め込み')
