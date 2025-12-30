import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultTemplates = [
  {
    name: 'Daily Note',
    description: '매일 작성하는 일일 노트 템플릿',
    isDefault: true,
    content: `# {{date}}

## Tasks
- [ ]

## Notes

## Reflections
`,
  },
  {
    name: 'Meeting Note',
    description: '회의록 템플릿',
    isDefault: true,
    content: `# Meeting: {{title}}

**Date:** {{date}}
**Attendees:**

## Agenda
1.

## Discussion
-

## Action Items
- [ ]

## Next Steps
`,
  },
  {
    name: 'Project Note',
    description: '프로젝트 노트 템플릿',
    isDefault: true,
    content: `# Project: {{title}}

## Overview
**Goal:**
**Timeline:**
**Status:**

## Requirements
-

## Tasks
- [ ]

## Resources
- [[Related Note]]

## Progress Log
### {{date}}
-
`,
  },
  {
    name: 'Book Note',
    description: '독서 노트 템플릿',
    isDefault: true,
    content: `# Book: {{title}}

**Author:**
**Started:** {{date}}
**Finished:**

## Summary


## Key Takeaways
-

## Quotes
>

## Personal Thoughts


## Related
- [[Related Book]]
`,
  },
]

async function main() {
  console.log('Starting template seeding...')

  for (const template of defaultTemplates) {
    const existing = await prisma.template.findFirst({
      where: { name: template.name },
    })

    if (existing) {
      console.log(`Template "${template.name}" already exists, skipping...`)
      continue
    }

    await prisma.template.create({
      data: template,
    })

    console.log(`Created template: ${template.name}`)
  }

  console.log('Template seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
