// app/success/page.tsx
export default function Success() {
  return (
    <main className="max-w-xl mx-auto p-10 text-center space-y-4">
      <h1 className="text-3xl font-bold">Payment Successful</h1>

      <p>Your company incorporation process is now complete.</p>

      <p className="text-muted-foreground text-sm">
        We’ll follow up shortly by email with next steps and documents.
      </p>

      <p className="text-xs text-muted-foreground">
        Thank you for choosing SCG for your business incorporation.
      </p>
    </main>
  );
}
