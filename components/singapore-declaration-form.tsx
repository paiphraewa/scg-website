// components/singapore-declaration-form.tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Director = {
  id?: string;
  fullName?: string;
  [key: string]: any;
};

type Props = {
  onboardingId: string;
  jurisdiction: string;
  companyName: string;
  directors: Director[];
};

// Simple row component (optional)
function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium ml-4 text-right">
        {value && value !== "" ? value : "—"}
      </span>
    </div>
  );
}

export function SingaporeDeclarationForm({
  onboardingId,
  jurisdiction,
  companyName,
  directors,
}: Props) {
  const router = useRouter();

  const [signingDirectorId, setSigningDirectorId] = useState<string>("");
  const [signingDirectorName, setSigningDirectorName] = useState<string>("");
  const [signatureMethod, setSignatureMethod] = useState<
    "draw" | "upload" | null
  >(null);
  const [signaturePreview, setSignaturePreview] = useState<string>("");
  const [signatureType, setSignatureType] = useState<"" | "drawn" | "uploaded">(
    ""
  );
  const [signedAt, setSignedAt] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string>("");

  // canvas state (BVI-style)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // ---- signature drawing handlers ----
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.closePath();
    setIsDrawing(false);

    // Save to preview
    const dataUrl = canvas.toDataURL("image/png");
    setSignaturePreview(dataUrl);
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const c = canvasRef.current;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, c.width, c.height);
      }
    }
    setSignaturePreview("");
    setSignatureType("");
    setSignedAt("");
  };

  const saveDrawnSignature = () => {
    if (!signaturePreview) return;
    setSignatureType("drawn");
    setSignedAt(new Date().toISOString());
    setSignatureMethod(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      alert("Please upload a JPG, PNG or GIF image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File must be < 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setSignaturePreview(dataUrl);
      setSignatureType("uploaded");
      setSignedAt(new Date().toISOString());
    };
    reader.readAsDataURL(file);

    setSignatureMethod(null);
  };

  const resetSignature = () => {
    setSignaturePreview("");
    setSignatureType("");
    setSignedAt("");
    setSignatureMethod(null);
  };

  // ---- submit handler ----
  const handleSubmit = async () => {
    try {
      setStepError("");
      if (!signingDirectorId || !signingDirectorName) {
        setStepError("Please select the signing director.");
        return;
      }
      if (!signatureType || !signaturePreview) {
        setStepError("Please provide a signature (draw or upload).");
        return;
      }

      setIsSubmitting(true);

      // 1️⃣ Save declaration into CompanyIncorporation.singaporeDeclaration
      const declRes = await fetch(
        "/api/company-incorporation/singapore/declaration",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            onboardingId,
            jurisdiction,
            data: {
              signingDirectorId,
              signingDirectorName,
              signatureType,
              signatureDataUrl: signaturePreview,
              signedAt,
            },
          }),
        }
      );

      if (!declRes.ok) {
        const txt = await declRes.text();
        console.error("Declaration save failed:", txt);
        setStepError("Failed to save declaration. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // 2️⃣ Ensure pending order & get pricingUrl
      const orderRes = await fetch("/api/incorporation/start-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          jurisdiction,
          companyNames: {
            firstPreference: companyName,
            chosenEnding: "",
          },
        }),
      });

      const json = await orderRes.json();
      if (!orderRes.ok) {
        console.error("Order error:", json);
        setStepError(json.error || "Failed to create order.");
        setIsSubmitting(false);
        return;
      }

      // 3️⃣ Redirect → Pricing
      if (json.pricingUrl) {
        router.push(json.pricingUrl);
      } else {
        // Fallback if backend forgot to send pricingUrl
        router.push(`/pricing?onboardingId=${onboardingId}`);
      }
    } catch (err) {
      console.error(err);
      setStepError("Unexpected error — please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-8 pt-6">
        {stepError && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md text-sm">
            {stepError}
          </div>
        )}

        {/* 1. Declaration text */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Declaration</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {/* 👉 TODO: Paste your real declaration paragraphs from the Word template here. */}
            I/We, the undersigned director(s), hereby declare that all
            information provided in connection with the incorporation of the
            Company is true, complete and accurate to the best of our knowledge.
            We confirm that the Company will not be used for any illegal
            purpose, including money laundering, terrorist financing, or any
            other unlawful activities, and we agree to notify the corporate
            service provider of any material changes to the Company’s structure,
            ownership or activities.
          </p>
        </section>

        {/* 2. Signing director selection */}
        <section className="space-y-2">
          <Label>Signing Director *</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={signingDirectorId}
            onChange={(e) => {
              const val = e.target.value;
              setSigningDirectorId(val);
              const dir = directors.find(
                (d) => String(d.id ?? d.fullName) === val
              );
              setSigningDirectorName(
                dir?.fullName ||
                  (typeof dir === "object" ? String(dir?.name ?? "") : "")
              );
            }}
          >
            <option value="">Select a director…</option>
            {directors.map((d, idx) => {
              const value = String(d.id ?? d.fullName ?? `dir-${idx}`);
              const label = d.fullName || d.name || `Director ${idx + 1}`;
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        </section>

        {/* 3. Signature section */}
        <section className="space-y-4 border rounded-lg p-4">
          <h3 className="font-medium">Signature</h3>

          {/* Choose method */}
          {!signatureType && signatureMethod === null && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSignatureMethod("draw")}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <span className="font-medium">Draw Signature</span>
                <p className="text-sm text-muted-foreground">
                  Use your mouse or trackpad
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSignatureMethod("upload")}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <span className="font-medium">Upload Signature</span>
                <p className="text-sm text-muted-foreground">
                  Upload an image of your signature
                </p>
              </button>
            </div>
          )}

          {/* Draw mode */}
          {signatureMethod === "draw" && !signatureType && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <Label>Draw your signature below</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                >
                  Clear
                </Button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="cursor-crosshair bg-white border border-gray-300 rounded-md block"
                  style={{ width: 600, height: 200, touchAction: "none" }}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSignatureMethod(null)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={saveDrawnSignature}
                  disabled={!signaturePreview}
                >
                  Save Signature
                </Button>
              </div>
            </div>
          )}

          {/* Upload mode */}
          {signatureMethod === "upload" && !signatureType && (
            <div className="border rounded-lg p-4 space-y-4">
              <Label>Upload your signature file</Label>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  id="sgDeclarationSignatureUpload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="sgDeclarationSignatureUpload"
                  className="cursor-pointer block"
                >
                  <p className="text-sm text-blue-600 font-medium">
                    Click to upload
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </label>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setSignatureMethod(null)}
              >
                Back
              </Button>
            </div>
          )}

          {/* Saved preview */}
          {signatureType && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <Label>
                  {signatureType === "drawn"
                    ? "Drawn Signature"
                    : "Uploaded Signature"}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetSignature}
                >
                  Change Signature
                </Button>
              </div>

              {signaturePreview && (
                <div className="bg-white border rounded-lg p-4 flex justify-center">
                  <img
                    src={signaturePreview}
                    alt="Signature preview"
                    className="max-w-full max-h-32"
                  />
                </div>
              )}

              <p className="text-xs text-green-600">
                ✓ Signature saved successfully
              </p>
            </div>
          )}

          {/* signed at info */}
          {signatureType && (
            <div className="bg-green-50 p-3 rounded-lg text-xs text-green-700 space-y-1">
              <p>✓ Signature Type: {signatureType}</p>
              <p>
                Signed At:{" "}
                {signedAt ? new Date(signedAt).toLocaleString() : "—"}
              </p>
            </div>
          )}
        </section>

        {/* Submit button */}
        <div className="flex justify-end pt-4 border-t">
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Continue to Payment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
