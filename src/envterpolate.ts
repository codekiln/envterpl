import fs from "fs-extra"
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

interface IMapper {
  (key: string, val: any): any
}

function mapObj(obj: object, mapper: IMapper) {
  return Object.assign(
    {},
    ...Object.entries(obj).map(([key, val]: [string, any]) => ({
      [key]: mapper(key, val)
    }))
  )
}

export function stringProcessingTraverser(
  obj: any,
  stringLeafNodeProcessor: IStringLeafNodeProcessor,
  parentKeys: string[] = []
) {
  const mapper: IMapper = (key: string, val: any) =>
    val === null
      ? null
      : typeof val === "string"
        ? stringLeafNodeProcessor(parentKeys.join("."), val as string)
        : typeof val === "object"
          ? stringProcessingTraverser(val, stringLeafNodeProcessor, parentKeys)
          : val
  return mapObj(obj, mapper)
}

export function interpolateStringLeafNodes(obj: object, dict: object): object {
  return stringProcessingTraverser(obj, matchedLeafInterpolator(dict))
}

export async function interpolateJson(
  pathToFileToInterpolate: string,
  pathToDotEnvFile: string
) {
  const fileToInterpolatePromise = fs
    .readJSON(pathToFileToInterpolate)
    .catch(err => err)
  const dotEnvfile = await fs.readFile(pathToDotEnvFile).catch(err => err)
  const varsToInterpolate = dotenvParse(dotEnvfile)
  const fileToInterpolate = await fileToInterpolatePromise
  return interpolateStringLeafNodes(fileToInterpolate, varsToInterpolate)
}
