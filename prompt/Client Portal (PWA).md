We are building a next js project based on an existing next js template that have auth, payment built already, below are rules you have to follow:

<frontend rules>
1. MUST Use 'use client' directive for client-side components; In Next.js, page components are server components by default, and React hooks like useEffect can only be used in client components.
2. The UI has to look great, using polished component from aceternity, tailwind when possible; Don't recreate aceternity components, make sure you use 'aceternity@latest add xxx' CLI to add components
3. MUST adding debugging log & comment for every single feature we implement
4. Make sure to concatenate strings correctly using backslash
7. Use stock photos from picsum.photos where appropriate, only valid URLs you know exist
8. Don't update aceternity components unless otherwise specified
9. Configure next.config.js image remotePatterns to enable stock photos from picsum.photos
11. MUST implement the navigation elements items in their rightful place i.e. Left sidebar, Top header
12. Accurately implement necessary grid layouts
13. Follow proper import practices:
   - Use @/ path aliases
   - Keep component imports organized
   - Update current src/app/page.tsx with new comprehensive code
   - Don't forget root route (page.tsx) handling
   - You MUST complete the entire prompt before stopping
</frontend rules>

<styling_requirements>
- You ALWAYS tries to use the aceternity/ui library.
- You MUST USE the builtin Tailwind CSS variable based colors as used in the examples, like bg-primary or text-primary-foreground.
- You DOES NOT use indigo or blue colors unless specified in the prompt.
- You MUST generate responsive designs.
- The React Code Block is rendered on top of a white background. If v0 needs to use a different background color, it uses a wrapper element with a background color Tailwind class.
</styling_requirements>

<frameworks_and_libraries>
- You prefers Lucide React for icons, and aceternity/ui for components.
- You MAY use other third-party libraries if necessary or requested by the user.
- You imports the aceternity/ui components from "@/components/ui"
- You DOES NOT use fetch or make other network requests in the code.
- You DOES NOT use dynamic imports or lazy loading for components or libraries. Ex: const Confetti = dynamic(...) is NOT allowed. Use import Confetti from 'react-confetti' instead.
- Prefer using native Web APIs and browser features when possible. For example, use the Intersection Observer API for scroll-based animations or lazy loading.
</frameworks_and_libraries>

# GenHub Client Portal (PWA) – Implementation Guide

## Task
Implement the **Client Portal** at `/app/client` as a beautiful, responsive PWA-ready page for clients to view project timeline, progress, AI summaries, photos, docs, change orders, and invoices.  
**All UI must use aceternity/ui, Tailwind variable colors, and Lucide icons.**  
**Auth, payment, and layout are already handled by the template.**

---

## Implementation Steps

### 1. **Route & Page Setup**

- Create the page at:  
  `app/app/client/page.tsx`
- This page is protected by existing auth middleware.  
- Only users with the `client` role (or appropriate permission) should see client data.  
  - Add a debug log at the top of the page to output the current user and their role for troubleshooting:
    ```typescript
    console.log('[ClientPortal] user:', user, 'role:', user?.role)
    ```

---

### 2. **Data Fetching (Server-Side)**

- Fetch the following for the authenticated client:
  - Projects assigned to the client
  - Timeline/progress for each project
  - AI summaries
  - Photos & docs
  - Change orders
  - Invoices

- Use the **Supabase browser client** with the user’s access token (see data_fetching_guideline).  
- Example:
    ```typescript
    import { createSupabaseClient } from '@/utils/supabase/client'
    const supabase = await createSupabaseClient()
    const { data: projects, error: projectsError } = await supabase
      .from('project')
      .select('*')
      .eq('user_id', user.id)
    if (projectsError) {
      console.log('[ClientPortal] Error fetching projects:', projectsError)
    }
    ```

- Repeat for other tables (`change_order`, `invoice`, etc.), always log errors and fetched data for debugging.

---

### 3. **UI Structure**

- Use **aceternity/ui `Tabs`** for main sections:
  - Timeline
  - AI Summaries
  - Photos
  - Docs
  - Change Orders
  - Invoices

- Example:
    ```tsx
    import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
    <Tabs defaultValue="timeline" className="w-full">
      <TabsList>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="summaries">AI Summaries</TabsTrigger>
        <TabsTrigger value="photos">Photos</TabsTrigger>
        <TabsTrigger value="docs">Docs</TabsTrigger>
        <TabsTrigger value="change-orders">Change Orders</TabsTrigger>
        <TabsTrigger value="invoices">Invoices</TabsTrigger>
      </TabsList>
      {/* ...TabsContent for each section... */}
    </Tabs>
    ```

- **Responsive:**  
  - Tabs should be scrollable on mobile (`overflow-x-auto`).
  - All content must stack vertically on small screens.

---

### 4. **Timeline Section**

- Show a **progress bar** for each project, with Lucide icons for each phase.
- Use aceternity/ui `Progress` and custom stepper.
- Example:
    ```tsx
    import { Progress } from "@/components/ui/progress"
    import { CheckCircle, Circle } from "lucide-react"
    // For each project:
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <span className="font-semibold">{project.name}</span>
        {/* Show project status */}
      </div>
      <div className="flex items-center gap-4 mt-2">
        {phases.map((phase, idx) => (
          <div key={phase.name} className="flex flex-col items-center">
            {phase.completed ? (
              <CheckCircle className="text-primary" />
            ) : (
              <Circle className="text-muted-foreground" />
            )}
            <span className="text-xs mt-1">{phase.name}</span>
          </div>
        ))}
      </div>
      <Progress value={project.progress} className="mt-2" />
    </div>
    ```
- Log the project and phase data for debugging:
    ```typescript
    console.log('[ClientPortal] Project:', project, 'Phases:', phases)
    ```

---

### 5. **AI Summaries Section**

- For each project, show the latest AI-generated summary in a aceternity/ui `Card`.
- Add a download/share button (aceternity/ui `Button`).
- Example:
    ```tsx
    import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
    <Card>
      <CardHeader>
        <CardTitle>{project.name} – AI Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{summary.text}</p>
        <Button variant="outline" className="mt-4">Download PDF</Button>
      </CardContent>
    </Card>
    ```
- Log summary data:
    ```typescript
    console.log('[ClientPortal] AI Summary:', summary)
    ```

---

### 6. **Photos & Docs Sections**

- **Photos:**  
  - Show a responsive grid of images (aceternity/ui `Card` or custom grid).
  - Each photo: thumbnail, date, download button.
- **Docs:**  
  - List of documents (name, type, date, download).
- Example:
    ```tsx
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {photos.map(photo => (
        <Card key={photo.id}>
          <img src={photo.url} alt={photo.name} className="rounded-t" />
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-xs">{photo.date}</span>
              <Button size="icon" variant="ghost">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    ```
- Log photo/doc data:
    ```typescript
    console.log('[ClientPortal] Photos:', photos)
    console.log('[ClientPortal] Docs:', docs)
    ```

---

### 7. **Change Orders Section**

- List all change orders for the client’s projects.
- Show status (pending, approved, rejected), description, amount.
- Use aceternity/ui `Table`.
- Add approve/reject buttons for pending items.
- Example:
    ```tsx
    import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table"
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Description</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Amount</TableCell>
          <TableCell>Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {changeOrders.map(order => (
          <TableRow key={order.id}>
            <TableCell>{order.description}</TableCell>
            <TableCell>
              <Badge variant={order.status === 'approved' ? 'success' : order.status === 'rejected' ? 'destructive' : 'secondary'}>
                {order.status}
              </Badge>
            </TableCell>
            <TableCell>${order.amount}</TableCell>
            <TableCell>
              {order.status === 'pending' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approveOrder(order.id)}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => rejectOrder(order.id)}>Reject</Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    ```
- Log change order data and actions:
    ```typescript
    console.log('[ClientPortal] Change Orders:', changeOrders)
    function approveOrder(id) {
      console.log('[ClientPortal] Approve order:', id)
      // ...call action
    }
    function rejectOrder(id) {
      console.log('[ClientPortal] Reject order:', id)
      // ...call action
    }
    ```

---

### 8. **Invoices Section**

- List invoices (date, amount, status, download link).
- Use aceternity/ui `Table`.
- Example:
    ```tsx
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Date</TableCell>
          <TableCell>Amount</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Download</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {invoices.map(inv => (
          <TableRow key={inv.id}>
            <TableCell>{inv.date}</TableCell>
            <TableCell>${inv.amount}</TableCell>
            <TableCell>
              <Badge variant={inv.status === 'paid' ? 'success' : 'secondary'}>
                {inv.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Button size="icon" variant="ghost">
                <Download className="w-4 h-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    ```
- Log invoice data:
    ```typescript
    console.log('[ClientPortal] Invoices:', invoices)
    ```

---

### 9. **Styling & Responsiveness**

- All sections must use Tailwind variable-based colors (e.g., `bg-primary`, `text-primary-foreground`).
- Use aceternity/ui components for all UI.
- Ensure all layouts are responsive:
  - Use `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` for grids.
  - Use `overflow-x-auto` for tables and tabs on mobile.
- Add spacing (`gap-4`, `mb-6`, etc.) for visual clarity.

---

### 10. **PWA & Offline Support**

- Show an **offline banner** (aceternity/ui `Alert`) if the user is offline.
- Use a custom hook (e.g., `useOnlineStatus`) to detect connectivity.
- Example:
    ```tsx
    import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
    if (!isOnline) {
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Offline</AlertTitle>
        <AlertDescription>
          You are offline. Some features may be unavailable.
        </AlertDescription>
      </Alert>
    }
    ```
- Log online/offline state:
    ```typescript
    console.log('[ClientPortal] Online status:', isOnline)
    ```

---

### 11. **Access Control**

- If a user without client permissions accesses `/app/client`, show a aceternity/ui `Alert` with a message and do not render client data.
- Log unauthorized access attempts:
    ```typescript
    console.log('[ClientPortal] Unauthorized access attempt by user:', user)
    ```

---

## Constraints & Guidelines

- **All UI must use aceternity/ui and Lucide icons.**
- **All colors must use Tailwind variable-based classes.**
- **No direct fetch calls; always use Supabase client as shown.**
- **Add detailed debug logs for all data fetches, errors, and user actions.**
- **All layouts must be fully responsive.**
- **Do not implement authentication, payment, or header logic here.**
- **Do not use indigo/blue colors unless specified.**
- **Do not use dynamic imports.**

---

## Example File Structure

```
app/app/client/page.tsx
components/client/ClientTimeline.tsx
components/client/ClientSummaries.tsx
components/client/ClientPhotos.tsx
components/client/ClientDocs.tsx
components/client/ClientChangeOrders.tsx
components/client/ClientInvoices.tsx
components/PWA/OfflineBanner.tsx
```

---

## Summary

- **Route:** `/app/client`
- **Tabs:** Timeline, AI Summaries, Photos, Docs, Change Orders, Invoices
- **Data:** Projects, phases, summaries, photos, docs, change orders, invoices (all filtered for the client)
- **UI:** aceternity/ui, Tailwind variable colors, Lucide icons, responsive
- **Debug:** Log all data, errors, and user actions for easy debugging
- **PWA:** Show offline banner if offline
- **Access:** Only for client users; show alert if unauthorized

---

**Ready for implementation.**  
Follow these steps and constraints to deliver a beautiful, robust, and debuggable Client Portal for GenHub.