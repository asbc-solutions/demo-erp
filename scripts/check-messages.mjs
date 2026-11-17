// Verifies that every locale has the same keys and placeholders as English and
// that no top-level namespace is declared in two files. Run: npm run i18n:check
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { parse, TYPE } from "@formatjs/icu-messageformat-parser"

const MESSAGES_DIR = join(import.meta.dirname, "..", "src", "i18n", "messages")
const SOURCE_LOCALE = "en"

function flatten(value, prefix = "", out = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (child && typeof child === "object") flatten(child, path, out)
    else out.set(path, String(child))
  }
  return out
}

/** Every argument name in an ICU message, including those nested in plural/select branches. */
function collectArguments(elements, names) {
  for (const element of elements) {
    if ("value" in element && element.type !== TYPE.literal && element.type !== TYPE.pound) {
      names.add(element.value)
    }
    for (const option of Object.values(element.options ?? {})) collectArguments(option.value, names)
    if (element.type === TYPE.tag) collectArguments(element.children, names)
  }
  return names
}

// Arabic plurals add zero/two/few/many branches, so compare the set of names, not the count.
function placeholders(message) {
  try {
    return [...collectArguments(parse(message), new Set())].sort().join(",")
  } catch (error) {
    return `<invalid ICU: ${error.message}>`
  }
}

function readLocale(locale) {
  const files = readdirSync(join(MESSAGES_DIR, locale)).filter((file) => file.endsWith(".json"))
  return new Map(
    files.map((file) => [file, JSON.parse(readFileSync(join(MESSAGES_DIR, locale, file), "utf8"))]),
  )
}

const problems = []
const locales = readdirSync(MESSAGES_DIR)
const source = readLocale(SOURCE_LOCALE)

const namespaceOwner = new Map()
for (const [file, messages] of source) {
  for (const namespace of Object.keys(messages)) {
    const owner = namespaceOwner.get(namespace)
    if (owner) problems.push(`namespace "${namespace}" is declared in both ${owner} and ${file}`)
    else namespaceOwner.set(namespace, file)
  }
}

for (const locale of locales.filter((l) => l !== SOURCE_LOCALE)) {
  const target = readLocale(locale)
  for (const [file, sourceMessages] of source) {
    const expected = flatten(sourceMessages)
    const actual = flatten(target.get(file) ?? {})
    for (const [key, message] of expected) {
      if (!actual.has(key)) problems.push(`${locale}/${file}: missing "${key}"`)
      else if (placeholders(actual.get(key)) !== placeholders(message))
        problems.push(`${locale}/${file}: placeholders differ for "${key}"`)
    }
    for (const key of actual.keys()) {
      if (!expected.has(key)) problems.push(`${locale}/${file}: extra key "${key}"`)
    }
  }
}

if (problems.length) {
  console.error(problems.join("\n"))
  console.error(`\n${problems.length} problem(s) found.`)
  process.exit(1)
}
console.log(`Messages OK: ${locales.join(", ")} match across ${source.size} files.`)
