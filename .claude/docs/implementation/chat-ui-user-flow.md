# Chat UI User Flow: @mentions & Previews

## Visual User Journey

### 1. Starting to Type a Mention

```
┌─────────────────────────────────────────────────────────┐
│ Chat Room: Office Renovation                            │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                          │
│ [Message Thread]                                        │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Type a message...                                  │ │
│ │ @█                                                 │ │
│ │                                                    │ │
│ └────────────────────────────────────────────────────┘ │
│   ENTER to send • SHIFT+ENTER for new line             │
└─────────────────────────────────────────────────────────┘

User types "@"
↓
```

### 2. Autocomplete Dropdown Appears

```
┌─────────────────────────────────────────────────────────┐
│ Chat Room: Office Renovation                            │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                          │
│ [Message Thread]                                        │
│                                                          │
│ ┌──────────────────────────────────┐                   │
│ │ 🔍 SELECT TYPE                   │                   │
│ ├──────────────────────────────────┤                   │
│ │ 🏢 Project       @project:       │◄── Selected      │
│ │ 📋 Task          @task:          │                   │
│ │ 🔨 Material      @material:      │                   │
│ │ 💰 Expense       @expense:       │                   │
│ │ 👤 User          @               │                   │
│ ├──────────────────────────────────┤                   │
│ │ ↑↓ Navigate  ENTER Select  ESC  │                   │
│ └──────────────────────────────────┘                   │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Type a message...                                  │ │
│ │ @█                                                 │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

User sees entity type options
↓
```

### 3. User Types Query

```
┌─────────────────────────────────────────────────────────┐
│ Chat Room: Office Renovation                            │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                          │
│ [Message Thread]                                        │
│                                                          │
│ ┌──────────────────────────────────┐                   │
│ │ 🔍 SEARCH TASKS                  │                   │
│ ├──────────────────────────────────┤                   │
│ │ 🏗️ 📋 Install HVAC System       │◄── Selected      │
│ │      In Progress • High          │                   │
│ │ 📋 Install Electrical Wiring     │                   │
│ │      Todo • Medium               │                   │
│ │ 📋 Install Plumbing              │                   │
│ │      In Progress • Low           │                   │
│ ├──────────────────────────────────┤                   │
│ │ 🔄 Searching...                  │                   │
│ └──────────────────────────────────┘                   │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Type a message...                                  │ │
│ │ @task:install█                                     │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

User types "@task:install"
Autocomplete shows matching tasks
↓
```

### 4. Entity Selected - Token Inserted

```
┌─────────────────────────────────────────────────────────┐
│ Chat Room: Office Renovation                            │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                          │
│ [Message Thread]                                        │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Mentioned Entities:                                │ │
│ │ ┌──────────────────────────┐                       │ │
│ │ │ 📋 Install HVAC System ✖ │                       │ │
│ │ └──────────────────────────┘                       │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Type a message...                                  │ │
│ │ Please check @[task:uuid:Install HVAC System] █   │ │
│ │                                                    │ │
│ └────────────────────────────────────────────────────┘ │
│   ENTER to send • SHIFT+ENTER for new line             │
└─────────────────────────────────────────────────────────┘

User presses Enter on selected task
Token inserted, badge appears
↓
```

### 5. Message Sent with Mention

```
┌─────────────────────────────────────────────────────────┐
│ Chat Room: Office Renovation                            │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ 👤 John Doe                         9:45 AM          ││
│ │                                                      ││
│ │ Please check @[task:uuid:Install HVAC System]       ││
│ │                                                      ││
│ │ ┌─────────────────────────────────────────────────┐ ││
│ │ │ 📋 Install HVAC System              [PREVIEW]   │ ││
│ │ │                                                 │ ││
│ │ │ 🔵 In Progress  🚩 High Priority               │ ││
│ │ │                                                 │ ││
│ │ │ 👤 Mike Wilson      📅 Today                    │ ││
│ │ │                                                 │ ││
│ │ │ Click to view task details                      │ ││
│ │ └─────────────────────────────────────────────────┘ ││
│ │                                                      ││
│ │ [😊 👍 🏗️]                    [Reply  Copy  ...]    ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Type a message...                                  │ │
│ │ █                                                  │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

Message displays with rich preview card
Preview shows task details
↓
```

### 6. Multiple Entity Types in One Message

```
┌─────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────┐│
│ │ 👤 Sarah PM                         10:23 AM         ││
│ │                                                      ││
│ │ Update: @[project:123:Office Reno] is behind        ││
│ │ schedule. @[task:456:Install Elec] is blocked by    ││
│ │ @[material:789:Copper Wire] shortage. Approved      ││
│ │ @[expense:abc:Emergency Order] for delivery.        ││
│ │                                                      ││
│ │ ┌─────────────────────────────────────────────────┐ ││
│ │ │ 🏢 Office Reno                      [PROJECT]   │ ││
│ │ │ 🔵 Active  ❤️ 78%  ████████░░ 85%             │ ││
│ │ └─────────────────────────────────────────────────┘ ││
│ │                                                      ││
│ │ ┌─────────────────────────────────────────────────┐ ││
│ │ │ 📋 Install Electrical Wiring        [TASK]      │ ││
│ │ │ 🔴 Blocked  🚩 High                            │ ││
│ │ └─────────────────────────────────────────────────┘ ││
│ │                                                      ││
│ │ ┌─────────────────────────────────────────────────┐ ││
│ │ │ 🔨 Copper Wire, 12 AWG             [MATERIAL]   │ ││
│ │ │ 💵 $2.45/ft  🔴 Out of Stock                   │ ││
│ │ └─────────────────────────────────────────────────┘ ││
│ │                                                      ││
│ │ ┌─────────────────────────────────────────────────┐ ││
│ │ │ 💰 Emergency Material Order         [EXPENSE]   │ ││
│ │ │ 🟢 Approved  🏢 Home Depot                     │ ││
│ │ │           💵 $3,450.00                          │ ││
│ │ └─────────────────────────────────────────────────┘ ││
│ └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘

Multiple previews stack vertically
Each entity gets its own rich card
↓
```

### 7. Clicking a Preview Card

```
User clicks on Task preview card
↓
Navigation: /app/tasks/456
↓
Task Detail Page opens with full information
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `@` | Trigger autocomplete |
| `↑` | Navigate up in autocomplete |
| `↓` | Navigate down in autocomplete |
| `ENTER` | Select highlighted result |
| `ESC` | Close autocomplete |
| `TAB` | Close autocomplete (no insert) |
| `SHIFT+ENTER` | New line in message |
| `ENTER` | Send message |

---

## Mobile Touch Flow

### 1. Tap @ in keyboard
- Autocomplete appears above keyboard
- Entity type filters shown

### 2. Tap entity type
- Filtered results appear
- Search input focused

### 3. Tap result
- Token inserted
- Badge appears
- Keyboard remains open

### 4. Tap Send
- Message sent with preview cards
- Preview cards are touch-scrollable

---

## Edge Cases Handled

### Empty Search Results
```
┌──────────────────────────────────┐
│ 🔍 SEARCH PROJECTS               │
├──────────────────────────────────┤
│                                  │
│      No results found            │
│   Try a different search term    │
│                                  │
└──────────────────────────────────┘
```

### Loading State
```
┌──────────────────────────────────┐
│ 🔍 SEARCH TASKS                  │
├──────────────────────────────────┤
│                                  │
│    🔄 SEARCHING...               │
│                                  │
└──────────────────────────────────┘
```

### Failed Preview Fetch
```
┌─────────────────────────────────────┐
│ ❌ Failed to load preview           │
│ Task not found                      │
└─────────────────────────────────────┘
```

### Preview Loading Skeleton
```
┌─────────────────────────────────────┐
│ ⬜ ████████████                    │
│ ⬜ ██████                           │
│                                     │
│ ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜              │
└─────────────────────────────────────┘
```

---

## Notification Flow

When user is mentioned:
1. Message sent with `@[user:uuid:John Doe]`
2. Server action creates notification for John
3. John receives notification: "Sarah mentioned you in a message"
4. Click notification → Navigate to chat room
5. Message with mention is highlighted (future feature)

---

## Design Tokens

### Autocomplete Dropdown
- Border: 2px solid #001B51
- Background: #FFFFFF
- Selected: #001B51 background, white text
- Hover: #001B51 at 10% opacity
- Shadow: 2xl (construction-themed)

### Entity Badges
- Background: #001B51
- Text: #FFFFFF
- Border: 2px solid #001B51 at 50% opacity
- Border radius: 6px
- Padding: 4px 8px

### Preview Cards
- Border: 2px solid #001B51
- Background: #FFFFFF
- Border radius: 12px
- Padding: 16px
- Shadow: construction-lg on hover
- Max width: 400px

---

**User flow complete - from @ trigger to rich preview cards with full construction-themed design.**
