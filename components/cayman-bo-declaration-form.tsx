"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface CaymanBoDeclarationFormProps {
  onboardingId: string;
  jurisdiction: string;
  initialData: CaymanBoDeclarationData;
}

export interface CaymanBoDeclarationData {
  entityName: string;
  incorporationNumber: string;
  entityType: string;
  category: string;
  declarationText: string;

  signer: {
    firstName: string;
    lastName: string;
    email: string;
    capacity: string;
  };

  // Signature / declaration meta (Option B – on top of existing fields)
  completedByName?: string;
  signature?: string;
  signed?: boolean;
  signatureType?: "drawn" | "uploaded" | null;
  signatureFileName?: string;
  signatureDataUrl?: string;
  signedAt?: string;
}

const FORM_STEPS = [
  { id: "details", title: "1. Entity Details" },
  { id: "declaration", title: "2. Declaration & Signer" },
  { id: "review", title: "3. Review & Signature" },
];

export default function CaymanBoDeclarationForm({
  onboardingId,
  jurisdiction,
  initialData,
}: CaymanBoDeclarationFormProps) {
  const router = useRouter();

  // ---------------- STEP + PROGRESS ----------------
  const [currentStep, setCurrentStep] = useState(0);
  const currentStepId = FORM_STEPS[currentStep].id;
  const progress = ((currentStep + 1) / FORM_STEPS.length) * 100;

  // ---------------- FORM STATE ----------------
  const [formData, setFormData] = useState<CaymanBoDeclarationData>({
    entityName: initialData.entityName || "",
    incorporationNumber: initialData.incorporationNumber || "",
    entityType: initialData.entityType || "",
    category: initialData.category || "",
    declarationText: initialData.declarationText || "",
    signer: initialData.signer || {
      firstName: "",
      lastName: "",
      email: "",
      capacity: "",
    },
    completedByName: initialData.completedByName || "",
    signature: initialData.signature || "",
    signed: initialData.signed || false,
    signatureType: initialData.signatureType ?? null,
    signatureFileName: initialData.signatureFileName || "",
    signatureDataUrl: initialData.signatureDataUrl || "",
    signedAt: initialData.signedAt || "",
  });

  // ---------------- SIGNATURE STATE ----------------
  const [signatureMethod, setSignatureMethod] = useState<
    "draw" | "upload" | null
  >(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string>(
    initialData.signatureDataUrl || ""
  );
  const [error, setError] = useState<string>("");

  // ---------------- AUTOSAVE (Production only) ----------------
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!onboardingId) return;

    const t = setTimeout(() => {
      fetch("/api/company-incorporation/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          jurisdiction: "CAYMAN",
          caymanBoDeclaration: formData,
        }),
      });
    }, 700);

    return () => clearTimeout(t);
  }, [formData, onboardingId]);

  // ---------------- STEP CONTROLS ----------------
  function nextStep() {
    if (currentStep < FORM_STEPS.length - 1) setCurrentStep((s) => s + 1);
  }
  function prevStep() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  // ---------------- SIGNATURE HELPERS ----------------
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef) return;

    const canvas = canvasRef;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef) return;

    const canvas = canvasRef;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!canvasRef) return;

    const canvas = canvasRef;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.closePath();
    setIsDrawing(false);

    const dataUrl = canvas.toDataURL("image/png");
    setSignaturePreview(dataUrl);
  };

  const clearSignatureCanvas = () => {
    if (canvasRef) {
      const ctx = canvasRef.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
      }
    }
    setSignaturePreview("");
  };

  const resetSignature = () => {
    clearSignatureCanvas();
    setSignaturePreview("");
    setSignatureMethod(null);
    setError("");

    setFormData((prev) => ({
      ...prev,
      signatureType: null,
      signature: "",
      signatureFileName: "",
      signatureDataUrl: "",
      signed: false,
      signedAt: "",
    }));

    const fileInput = document.getElementById(
      "bo-signature-upload"
    ) as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  };

  const saveDrawnSignature = () => {
    if (!signaturePreview && canvasRef) {
      const dataUrl = canvasRef.toDataURL("image/png");
      setSignaturePreview(dataUrl);
    }

    if (!signaturePreview && !canvasRef) {
      setError("Please draw your signature before saving.");
      return;
    }

    const dataUrl =
      signaturePreview || (canvasRef ? canvasRef.toDataURL("image/png") : "");
    if (!dataUrl) {
      setError("Could not capture signature. Please try again.");
      return;
    }

    const signedAtIso = new Date().toISOString();

    setFormData((prev) => ({
      ...prev,
      signatureType: "drawn",
      signature: "Drawn signature",
      signatureFileName: "signature.png",
      signatureDataUrl: dataUrl,
      signed: true,
      signedAt: prev.signedAt || signedAtIso,
    }));

    setSignatureMethod(null);
    setError("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, GIF) or PDF");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    const signedAtIso = new Date().toISOString();

    setFormData((prev) => ({
      ...prev,
      signatureType: "uploaded",
      signature: `Uploaded signature - ${file.name}`,
      signatureFileName: file.name,
      signed: true,
      signedAt: prev.signedAt || signedAtIso,
    }));

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setSignaturePreview(url);
        setFormData((prev) => ({
          ...prev,
          signatureDataUrl: url,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setSignaturePreview("");
    }

    setError("");
  };

  // ---------------- FINAL SUBMIT ----------------
  async function handleSubmit() {
    const res = await fetch(
      "/api/company-incorporation/cayman/beneficial-ownership",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          jurisdiction: "CAYMAN",
          data: formData,
        }),
      }
    );

    if (!res.ok) {
      alert("Failed to save Form 3.");
      return;
    }

    const orderRes = await fetch("/api/incorporation/start-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onboardingId,
        jurisdiction: "CAYMAN",
        companyNames: {
          firstPreference: formData.entityName || "Cayman Company",
        },
      }),
    });

    const orderJson = await orderRes.json();
    if (!orderJson?.pricingUrl) {
      alert("Order creation failed.");
      return;
    }

    router.push(orderJson.pricingUrl);
  }

  // ---------------- RENDER – BVI STYLE ----------------
  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="max-w-4xl mx-auto py-10 px-6 space-y-10">
        {/* HEADER (matches BVI) */}
        <div>
          <h1 className="text-2xl font-bold">
            Cayman Islands – Beneficial Ownership Declaration
          </h1>
          <p className="text-sm text-white/70">
            Please complete the BO declaration below.
          </p>
        </div>

        {/* MAIN CARD (dark, same as BVI) */}
        <div className="border border-white/10 bg-[#0B1221] rounded-xl p-6 shadow-lg space-y-8">
          {/* Progress */}
          <div className="space-y-2">
            <Progress
              value={progress}
              className="h-2 bg-white/10 [&>div]:bg-blue-600"
            />
            <div className="flex justify-between text-xs text-white/60">
              <span>
                Step {currentStep + 1} of {FORM_STEPS.length}
              </span>
              <span>{FORM_STEPS[currentStep].title}</span>
            </div>
          </div>

          {/* Step Pills */}
          <div className="flex flex-wrap gap-2">
            {FORM_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`px-3 py-1 rounded-full text-xs border ${
                  idx === currentStep
                    ? "bg-blue-600 border-blue-400 text-white"
                    : idx < currentStep
                    ? "bg-green-600/20 border-green-500/40 text-green-300"
                    : "bg-white/5 border-white/10 text-white/60"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>

          {/* STEP CONTENT */}
          <div className="space-y-8">
            {/* STEP 1 — ENTITY DETAILS */}
            {currentStepId === "details" && (
              <section className="space-y-6">
                <h2 className="text-lg font-semibold">1. Entity Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Entity Name</Label>
                    <Input
                      value={formData.entityName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          entityName: e.target.value,
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Incorporation Number</Label>
                    <Input
                      value={formData.incorporationNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          incorporationNumber: e.target.value,
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Entity Type</Label>
                    <Input
                      value={formData.entityType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          entityType: e.target.value,
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* STEP 2 — DECLARATION & SIGNER */}
            {currentStepId === "declaration" && (
              <section className="space-y-6">
                <h2 className="text-lg font-semibold">
                  2. Declaration & Signer
                </h2>

                {/* Declaration Text */}
                <div className="space-y-2">
                  <Label>Declaration</Label>
                  <Textarea
                    className="bg-[#0F172A] border-white/10 text-white"
                    rows={6}
                    value={formData.declarationText}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        declarationText: e.target.value,
                      }))
                    }
                    placeholder="Paste or draft the beneficial ownership declaration wording here."
                  />
                </div>

                {/* Signer Details Card */}
                <div className="border border-white/10 bg-[#020617] rounded-lg p-4 space-y-4">
                  <h3 className="font-semibold text-base">Signer Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={formData.signer.firstName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            signer: {
                              ...prev.signer,
                              firstName: e.target.value,
                            },
                          }))
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={formData.signer.lastName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            signer: {
                              ...prev.signer,
                              lastName: e.target.value,
                            },
                          }))
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.signer.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            signer: {
                              ...prev.signer,
                              email: e.target.value,
                            },
                          }))
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Capacity / Role</Label>
                      <Input
                        value={formData.signer.capacity}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            signer: {
                              ...prev.signer,
                              capacity: e.target.value,
                            },
                          }))
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Completed By Name (like BVI) */}
                  <div className="space-y-2">
                    <Label>Completed By (Full Name)</Label>
                    <Input
                      placeholder="Enter full name of authorised signatory"
                      value={
                        formData.completedByName ||
                        `${formData.signer.firstName} ${formData.signer.lastName}`.trim()
                      }
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          completedByName: e.target.value,
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* STEP 3 — REVIEW + BVI-STYLE SIGNATURE */}
            {currentStepId === "review" && (
              <section className="space-y-8">
                <h2 className="text-lg font-semibold">3. Review & Signature</h2>

                {/* Summary Cards (BVI style) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Entity Summary */}
                  <div className="border border-white/10 bg-[#020617] rounded-lg p-4 space-y-2 text-sm">
                    <h3 className="font-semibold text-base mb-1">Entity</h3>
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {formData.entityName || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Incorporation No.:</span>{" "}
                      {formData.incorporationNumber || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Type:</span>{" "}
                      {formData.entityType || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Category:</span>{" "}
                      {formData.category || "—"}
                    </p>
                  </div>

                  {/* Signer Summary */}
                  <div className="border border-white/10 bg-[#020617] rounded-lg p-4 space-y-2 text-sm">
                    <h3 className="font-semibold text-base mb-1">Signer</h3>
                    <p>
                      <span className="font-semibold">Name:</span>{" "}
                      {formData.signer.firstName || formData.signer.lastName
                        ? `${formData.signer.firstName} ${formData.signer.lastName}`.trim()
                        : "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Email:</span>{" "}
                      {formData.signer.email || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Capacity:</span>{" "}
                      {formData.signer.capacity || "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Completed By:</span>{" "}
                      {formData.completedByName ||
                        `${formData.signer.firstName} ${formData.signer.lastName}`.trim() ||
                        "—"}
                    </p>
                  </div>
                </div>

                {/* Declaration Text Preview */}
                <div className="border border-white/10 bg-[#020617] rounded-lg p-4 space-y-3 text-sm">
                  <h3 className="font-semibold text-base">Declaration</h3>
                  <p className="whitespace-pre-line text-white/80">
                    {formData.declarationText ||
                      "(No declaration text provided)"}
                  </p>
                </div>

                {/* BVI-Style Declaration + Signature Block */}
                <div className="space-y-6 border border-white/10 rounded-lg p-6 bg-[#020617]">
                  <h3 className="text-lg font-semibold">
                    Signature Declaration
                  </h3>

                  <p className="text-sm text-white/70 leading-relaxed">
                    I/We declare and affirm that the information provided herein
                    is true and correct to the best of my/our knowledge and that
                    the assets and ownership information disclosed do not derive
                    from any criminal, illegal, money-laundering, terrorist,
                    sanctions-busting or other nefarious activities. I/We are
                    aware that anti-money-laundering legislation applies and
                    that I am/We are bound by the statements given herein. I/We
                    confirm that, if requested to do so, I/We will provide any
                    further evidence as may be required and will promptly inform
                    Silverside of any changes to the beneficial ownership of the
                    entity.
                  </p>

                  {/* Completed By Name */}
                  <div className="space-y-2">
                    <Label>Completed By (Full Name) *</Label>
                    <Input
                      value={
                        formData.completedByName ||
                        `${formData.signer.firstName} ${formData.signer.lastName}`.trim()
                      }
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          completedByName: e.target.value,
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Enter your full legal name"
                      required
                    />
                  </div>

                  {/* Signature Method & UI */}
                  <div className="space-y-4">
                    <Label className="font-medium">Signature Method *</Label>

                    {/* Choose method */}
                    {!formData.signatureType && signatureMethod === null && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setSignatureMethod("draw")}
                          className="border-2 border-dashed border-white/20 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-500/10 transition-colors text-center"
                        >
                          <span className="font-medium">Draw Signature</span>
                          <p className="text-sm text-white/60">
                            Use your mouse to draw your signature
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSignatureMethod("upload")}
                          className="border-2 border-dashed border-white/20 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-500/10 transition-colors text-center"
                        >
                          <span className="font-medium">Upload Signature</span>
                          <p className="text-sm text-white/60">
                            Upload an image or PDF of your signature
                          </p>
                        </button>
                      </div>
                    )}

                    {/* Draw signature */}
                    {signatureMethod === "draw" && !formData.signatureType && (
                      <div className="border border-white/20 rounded-lg p-4 space-y-4 bg-[#020817]">
                        <div className="flex justify-between items-center">
                          <Label>Draw your signature below</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearSignatureCanvas}
                            className="border-white/40 text-white hover:bg-white/10"
                          >
                            Clear
                          </Button>
                        </div>

                        <div className="border-2 border-dashed border-white/30 rounded-lg bg-white">
                          <canvas
                            ref={setCanvasRef}
                            width={600}
                            height={200}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="cursor-crosshair bg-white border border-gray-300 rounded-md block"
                            style={{
                              width: 600,
                              height: 200,
                              touchAction: "none",
                            }}
                          />
                        </div>

                        <div className="flex gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSignatureMethod(null)}
                            className="border-white/40 text-white hover:bg-white/10"
                          >
                            Back
                          </Button>
                          <Button
                            type="button"
                            onClick={saveDrawnSignature}
                            disabled={!signaturePreview}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Save Signature
                          </Button>
                        </div>

                        {error && (
                          <p className="text-xs text-red-400">{error}</p>
                        )}
                      </div>
                    )}

                    {/* Upload signature */}
                    {signatureMethod === "upload" &&
                      !formData.signatureType && (
                        <div className="border border-white/20 rounded-lg p-4 space-y-4 bg-[#020817]">
                          <Label>Upload your signature file</Label>

                          <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center">
                            <input
                              id="bo-signature-upload"
                              type="file"
                              accept=".jpg,.jpeg,.png,.gif,.pdf"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <label
                              htmlFor="bo-signature-upload"
                              className="cursor-pointer block"
                            >
                              <p className="text-sm text-blue-400 font-medium">
                                Click to upload
                              </p>
                              <p className="text-xs text-white/60">
                                PNG, JPG, GIF, PDF up to 5MB
                              </p>
                            </label>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSignatureMethod(null)}
                            className="border-white/40 text-white hover:bg-white/10"
                          >
                            Back
                          </Button>

                          {error && (
                            <p className="text-xs text-red-400">{error}</p>
                          )}
                        </div>
                      )}

                    {/* Signature Preview */}
                    {(formData.signatureType === "drawn" ||
                      formData.signatureType === "uploaded") && (
                      <div className="border border-white/20 rounded-lg p-4 space-y-4 bg-[#020817]">
                        <div className="flex justify-between items-center">
                          <Label>
                            {formData.signatureType === "drawn"
                              ? "Drawn Signature"
                              : "Uploaded Signature"}
                          </Label>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={resetSignature}
                            className="border-white/40 text-white hover:bg-white/10"
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

                        {!signaturePreview &&
                          formData.signatureType === "uploaded" && (
                            <p className="text-xs text-white/60">
                              Signature file uploaded:{" "}
                              {formData.signatureFileName || "File saved"}
                            </p>
                          )}

                        <p className="text-xs text-green-400">
                          ✓ Signature saved successfully
                        </p>
                      </div>
                    )}

                    {/* Verification Info */}
                    {formData.signatureType && (
                      <div className="bg-emerald-900/40 border border-emerald-500/50 p-3 rounded-lg text-xs space-y-1 text-emerald-100">
                        <p>✓ Signature Type: {formData.signatureType}</p>
                        <p>
                          Signed At:{" "}
                          {formData.signedAt
                            ? new Date(formData.signedAt).toLocaleString()
                            : "—"}
                        </p>
                      </div>
                    )}
                  </div>

                  {error && !signatureMethod && (
                    <p className="text-xs text-red-400">{error}</p>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* NAVIGATION BUTTONS (BVI style) */}
          <div className="flex justify-between pt-4 border-t border-white/10">
            <Button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Previous
            </Button>

            {currentStep < FORM_STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Submit & Continue to Pricing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
