---
surfaice: v1
route: /
name: Todo App
baseUrl: https://todo.example.com
capabilities:
  - id: add-todo
    description: "User adds a new todo item"
    elements: [new-todo, add-btn]
  - id: complete-todo
    description: "User marks a todo as done"
    elements: [todo-checkbox]
  - id: delete-todo
    description: "User removes a todo"
    elements: [todo-delete]
---

# / — Todo App

## Header
- [logo] image "Todo App" (link → /)
- [user-menu] button "{user.name}" → reveals:
  - [profile] link "Profile" → navigates: /profile
  - [logout] button "Log Out" → POST /api/logout → navigates: /login

## Add Todo
- [new-todo] textbox "What needs to be done?" (required)
- [add-btn] button "Add" → POST /api/todos → prepends: [todo-item] in [todo-list]

## Todo List
- [todo-list] list → each [todo-item]:
  - [todo-checkbox] checkbox "{todo.text}" → PATCH /api/todos/{todo.id} → toggles: strikethrough
  - [todo-delete] button "×" (destructive) → DELETE /api/todos/{todo.id} → removes: [todo-item]

## Filters
- [filter-all] button "All" → filters: todo-list shows all
- [filter-active] button "Active" → filters: todo-list shows unchecked
- [filter-done] button "Completed" → filters: todo-list shows checked
- [count] text → shows: "{active_count} items left"

## States
- [empty]: [todo-list] hidden, shows: "No todos yet. Add one above!"
- [loading]: [todo-list] shows spinner
- [error]: toast "Failed to load todos"
