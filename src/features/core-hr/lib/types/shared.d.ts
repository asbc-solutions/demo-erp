/** Generic recursive tree node returned by hierarchy/tree endpoints */
export type TreeNode = {
  id: string
  name: string
  depth: number
  children?: TreeNode[]
  [key: string]: unknown
}
