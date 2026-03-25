export type ItemId = string | number

export interface TreeItem {
  id: ItemId
  parent: ItemId | null
  [key: string]: unknown
}

export class TreeStore {
  private items: TreeItem[]
  private itemMap: Map<ItemId, TreeItem>
  private childrenMap: Map<ItemId, TreeItem[]>

  constructor(items: TreeItem[]) {
    this.items = items
    this.itemMap = new Map()
    this.childrenMap = new Map()

    for (const item of items) {
      this.itemMap.set(item.id, item)
      if (!this.childrenMap.has(item.id)) {
        this.childrenMap.set(item.id, [])
      }
      if (item.parent !== null) {
        if (!this.childrenMap.has(item.parent)) {
          this.childrenMap.set(item.parent, [])
        }
        this.childrenMap.get(item.parent)!.push(item)
      }
    }
  }

  getAll(): TreeItem[] {
    return this.items
  }

  getItem(id: ItemId): TreeItem | undefined {
    return this.itemMap.get(id)
  }

  getChildren(id: ItemId): TreeItem[] {
    return this.childrenMap.get(id) ?? []
  }

  getAllChildren(id: ItemId): TreeItem[] {
    const result: TreeItem[] = []
    const stack = [...this.getChildren(id)]
    while (stack.length) {
      const item = stack.pop()!
      result.push(item)
      stack.push(...this.getChildren(item.id))
    }
    return result
  }

  getAllParents(id: ItemId): TreeItem[] {
    const result: TreeItem[] = []
    let current = this.itemMap.get(id)
    while (current) {
      result.push(current)
      current = current.parent !== null
        ? this.itemMap.get(current.parent)
        : undefined
    }
    return result
  }

  addItem(item: TreeItem): void {
    this.items.push(item)
    this.itemMap.set(item.id, item)
    if (!this.childrenMap.has(item.id)) {
      this.childrenMap.set(item.id, [])
    }
    if (item.parent !== null) {
      if (!this.childrenMap.has(item.parent)) {
        this.childrenMap.set(item.parent, [])
      }
      this.childrenMap.get(item.parent)!.push(item)
    }
  }

  removeItem(id: ItemId): void {
    const toRemove = [id, ...this.getAllChildren(id).map(i => i.id)]
    for (const removeId of toRemove) {
      const item = this.itemMap.get(removeId)
      if (!item) continue
      if (item.parent !== null) {
        const siblings = this.childrenMap.get(item.parent)
        if (siblings) {
          this.childrenMap.set(item.parent, siblings.filter(i => i.id !== removeId))
        }
      }
      this.itemMap.delete(removeId)
      this.childrenMap.delete(removeId)
    }
    this.items = this.items.filter(i => !toRemove.includes(i.id))
  }

  updateItem(updated: TreeItem): void {
    const existing = this.itemMap.get(updated.id)
    if (!existing) return
    if (existing.parent !== updated.parent) {
      if (existing.parent !== null) {
        const oldSiblings = this.childrenMap.get(existing.parent)
        if (oldSiblings) {
          this.childrenMap.set(existing.parent, oldSiblings.filter(i => i.id !== updated.id))
        }
      }
      if (updated.parent !== null) {
        if (!this.childrenMap.has(updated.parent)) {
          this.childrenMap.set(updated.parent, [])
        }
        this.childrenMap.get(updated.parent)!.push(updated)
      }
    }
    this.itemMap.set(updated.id, updated)
    const index = this.items.findIndex(i => i.id === updated.id)
    if (index !== -1) this.items[index] = updated
  }
}