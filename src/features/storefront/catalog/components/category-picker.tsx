import type { CatalogCategory } from '../filter-products'

type CategoryPickerProps = {
  categories: CatalogCategory[]
  value: string
  onChange: (category: string) => void
}

export function CategoryPicker({ categories, value, onChange }: CategoryPickerProps) {
  return (
    <select
      aria-label="Category"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
    >
      <option value="All">All categories</option>
      {categories.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  )
}
