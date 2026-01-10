# /kc:gen-index

## Usage
```bash
/kc:gen-index                    # All indexes
/kc:gen-index --type=tables      # Just tables
/kc:gen-index --type=actions     # Just actions
/kc:gen-index --type=components  # Just components
```

## Execution

### tables.md
1. Run `mcp__supabase__list_tables`
2. Parse table names, columns, foreign keys
3. Format into markdown table
4. Write to indexes/tables.md

### actions.md
1. Glob `app/actions/*.ts`
2. Parse each file for exported functions
3. Extract: name, input type, output type, revalidatePath
4. Format into markdown tables by file
5. Write to indexes/actions.md

### components.md
1. Glob `components/**/*.tsx`
2. Parse for interface/type Props
3. Extract: name, props, 'use client' presence
4. Format into markdown tables by directory
5. Write to indexes/components.md