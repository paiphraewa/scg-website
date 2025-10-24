// app/api/debug/db/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // show env actually loaded by Next
    const dbUrl = process.env.DATABASE_URL || 'not set'

    const meta = await prisma.$queryRawUnsafe<any[]>(`
      select current_database() as db, current_schema() as schema;
    `)

    const tables = await prisma.$queryRawUnsafe<any[]>(`
      select table_schema, table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name;
    `)

    return NextResponse.json({
      runtime_database_url: dbUrl,
      current_db: meta?.[0]?.db,
      current_schema: meta?.[0]?.schema,
      public_tables: tables.map(t => t.table_name),
      has_orders: tables.some(t => t.table_name === 'orders'),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
