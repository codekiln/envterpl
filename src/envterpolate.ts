import { readFile } from "fs-extra"
import { parse as dotenvParse } from "dotenv"
import { stringFormat } from "@brycemarshall/string-format"
import minimatch from "minimatch"

export interface IStringLeafNodeProcessor {
  (stringNodePath: string, toInterpolate: string): string
}

export interface IStringLeafNodeInterpolator {
  (dictionary: object): IStringLeafNodeProcessor
}

export interface IPathMatcher {
  (currentPath: string): boolean
}

export interface IGlobPathMatcher {
  (matchPathGlob: string): IPathMatcher
}

export const globPathMatcher: IGlobPathMatcher = (matchPathGlob: string) => (
  currentPath: string
) => minimatch(currentPath, matchPathGlob) as boolean

export const matchedLeafInterpolator = (
  dictionary: object,
  matches: IPathMatcher = globPathMatcher("**")
) => (stringNodePath: string, stringLeafNode: string): string =>
  matches(stringNodePath)
    ? stringFormat(stringLeafNode, dictionary)
    : stringLeafNode

export function stringProcessingTraverser(
  obj: any,
  stringLeafNodeProcessor: IStringLeafNodeProcessor,
  parentKeys: string[] = []
) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const val = obj[key]
      if (val !== null) {
        const visitedStringNodePath = [...parentKeys, key]
        if (typeof val === "object") {
          obj[key] = stringProcessingTraverser(
            val,
            stringLeafNodeProcessor,
            visitedStringNodePath
          )
        } else if (typeof val === "string") {
          obj[key] = stringLeafNodeProcessor(
            visitedStringNodePath.join("."),
            val as string
          )
        }
      }
    }
  }
  return obj
}

export function interpolateStringLeafNodes(obj: object, dict: object): object {
  return stringProcessingTraverser(obj, matchedLeafInterpolator(dict))
}

export async function interpolateFile(
  pathToFileToInterpolate: string,
  pathToDotEnvFile: string
) {
  const fileToInterpolatePromise = readFile(pathToFileToInterpolate)
  const varsToInterpolate = dotenvParse(pathToDotEnvFile)
  const fileToInterpolate = await fileToInterpolatePromise
  return interpolateStringLeafNodes(fileToInterpolate, varsToInterpolate)
}
