export type PropertyType = 'select' | 'multi_select' | 'date' | 'checkbox'

export interface PropertyDefinition {
  id: string
  name: string
  type: PropertyType | string
  options: string[] | null
}

export interface NotePropertyValue {
  id: string
  propertyId: string
  value: unknown
  property: PropertyDefinition
}
