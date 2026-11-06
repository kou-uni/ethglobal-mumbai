#!/usr/bin/env node
// Build ui/index.html by embedding scenes.json into the HTML.
// It is embedded because fetch does not work when the page is opened from outside
// (GitHub Pages, a phone).
import { readFileSync, writeFileSync } from 'node:fs'
const here = (p) => new URL(p, import.meta.url)
const tpl = readFileSync(here('./index.template.html'), 'utf8')
const data = readFileSync(here('./scenes.json'), 'utf8')
writeFileSync(here('./index.html'), tpl.replace('/*__SCENES__*/ null', data.trim()))
console.log('wrote ui/index.html', 'embedded ' + (data.length / 1024).toFixed(0) + 'KB of data')
