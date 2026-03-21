# @surfaice/react

React annotation components for Surfaice — describe your UI once, agents navigate it, CI verifies it.

## Install

```bash
npm install @surfaice/react @surfaice/format
```

## Usage

```tsx
import { SurfaiceProvider, ui } from '@surfaice/react'

// Wrap your app
<SurfaiceProvider enabled={process.env.SURFAICE_ENABLED === 'true'}>
  <App />
</SurfaiceProvider>

// Annotate your pages
<ui.page route="/settings" name="Settings Page" states={['auth-required']}>
  <ui.section name="Profile">
    <ui.element id="name" type="textbox" label="Display Name"
      value={user.name}
      current="{user.name}"
      action="PUT /api/profile">
      <input value={user.name} onChange={handleChange} />
    </ui.element>
    <ui.element id="save" type="button" label="Save Changes"
      action="PUT /api/profile"
      result="toast 'Saved!'">
      <button onClick={handleSave}>Save</button>
    </ui.element>
  </ui.section>
</ui.page>
```

## API

### `<SurfaiceProvider enabled? />`
Context provider. Set `enabled={true}` to collect annotations. Zero overhead when disabled.

### `ui.page` / `ui.section` / `ui.element`
Annotation components — always render children as-is, optionally register metadata.

### `useSurfaicePage(): SurfaicePage | null`
Hook to access the collected page AST. Use in middleware or dev tools.

## Zero Overhead When Disabled

All annotation components are pure passthroughs when `enabled={false}` (the default). Ship to production without worry.
