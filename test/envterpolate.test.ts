import {
  globPathMatcher,
  matchedLeafInterpolator,
  stringProcessingTraverser
} from "../src/envterpolate"

describe("matchedLeafInterpolator", () => {
  const dict = {
    rightNow: "right about now",
    funkSoul: "the funk soul brother",
    checkIt: "check it out now",
    rocka: "rockafeller"
  }

  const expectedFatboySlim = `right about now, the funk soul brother
check it out now
the funk soul brother (repeat)
(1:50 in song) rockafeller, rockafeller
right about now, the funk soul brother
check it out now
the funk soul brother`

  const fatboySlimTemplate = `{rightNow}, {funkSoul}
{checkIt}
{funkSoul} (repeat)
(1:50 in song) {rocka}, {rocka}
{rightNow}, {funkSoul}
{checkIt}
{funkSoul}`

  /**
   * Given a template compiled to interpolate only on `matchingPrefix`,
   * return the result of using the generated interpolator on the
   * fatboySlimTemplate with `actualPrefix`
   * @param {string} matchingPrefix - the prefix that should activate the interpolator
   * @param {string} actualPrefix - the "actual" prefix of a given node in the tree
   * @returns {string} - the result of the interpolation
   */
  const getStringFromPrefix = (
    matchingPrefix: string,
    actualPrefix: string
  ): string =>
    matchedLeafInterpolator(dict, globPathMatcher(matchingPrefix))(
      actualPrefix,
      fatboySlimTemplate
    )

  const assertShouldMatch = (matchingPrefix: string, actualPrefix: string) =>
    expect(getStringFromPrefix(matchingPrefix, actualPrefix)).toEqual(
      expectedFatboySlim
    )

  const assertShouldNotMatch = (matchingPrefix: string, actualPrefix: string) =>
    expect(getStringFromPrefix(matchingPrefix, actualPrefix)).toEqual(
      fatboySlimTemplate
    )

  it("'matches' with 'matches'", () => assertShouldMatch("matches", "matches"))
  it("'matches.*' with 'matches.asdf'", () =>
    assertShouldMatch("matches.*", "matches.asdf"))
  it("'matches.**' with 'matches.asdf'", () =>
    assertShouldMatch("matches.**", "matches.asdf"))
  it("'matches.**' with 'matches.asdf.qwer'", () =>
    assertShouldMatch("matches.**", "matches.asdf.qwer"))
  it("'*.matches' with 'asdf.matches'", () =>
    assertShouldMatch("*.matches", "asdf.matches"))
  it("'**.matches' with 'asdf.qwer.matches'", () =>
    assertShouldMatch("**.matches", "asdf.qwer.matches"))

  it("'fails.match' with 'fails.qwer'", () =>
    assertShouldNotMatch("fails.match", "fails.qwer"))
  it("'fails.match.*' with 'fails.match'", () =>
    assertShouldNotMatch("fails.match.*", "fails.match"))
  it("'fails.match.**' with 'fails.match'", () =>
    assertShouldNotMatch("fails.match.**", "fails.match"))
  it("'*.fails.match' with 'fails.match'", () =>
    assertShouldNotMatch("fails.match.**", "fails.match"))
  it("'**.fails.match' with 'fails.match'", () =>
    assertShouldNotMatch("fails.match.**", "fails.match"))
})

describe("stringProcessingTraverser", () => {
  it("visits every leaf node", () => {
    const expectedLeaves: string[] = ["val1", "val2", "val3", "val4", "val5"]
    let visitedLeaves: string[] = []
    const visitor = (key: string, val: string): string => {
      console.log(`visited key ${key} and val ${val}`)
      visitedLeaves.push(val)
      return val
    }
    const obj = {
      level1key1: expectedLeaves[0],
      level1key2: {
        level2key1: expectedLeaves[1],
        level2key2: {
          level3key1: expectedLeaves[2]
        },
        level2key3: expectedLeaves[3]
      },
      level1key3: expectedLeaves[4]
    }
    stringProcessingTraverser(obj, visitor)
    expect(visitedLeaves).toEqual(expectedLeaves)
  })
})
