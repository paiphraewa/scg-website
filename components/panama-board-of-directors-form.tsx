"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchableCountrySelect } from "@/components/searchable-country-select";
import { useRouter } from "next/navigation";
import { useDebouncedEffect } from "@/hooks/useDebouncedEffect";

type PanamaDirectorsProps = {
  onboardingId: string;
  jurisdiction: string;
};

export default function PanamaBoardOfDirectorsForm({
  onboardingId,
  jurisdiction,
}: PanamaDirectorsProps) {
  const router = useRouter();

  type Director = {
    fullName: string;
    nationality: string;
    address: string;
    passportNumber: string;
    dateOfBirth: string;
    email: string;
    phoneCountryCode: string;
    phoneNumber: string;
    expectedPhoneLength: number;
    isPEP: string;
  };

  const [directors, setDirectors] = useState<Director[]>([
    {
      fullName: "",
      nationality: "",
      address: "",
      passportNumber: "",
      dateOfBirth: "",
      email: "",
      phoneCountryCode: "",
      phoneNumber: "",
      expectedPhoneLength: 0,
      isPEP: "",
    },
  ]);

  const [error, setError] = useState("");

  const addDirector = () => {
    setDirectors((prev) => [
      ...prev,
      {
        fullName: "",
        nationality: "",
        address: "",
        passportNumber: "",
        dateOfBirth: "",
        email: "",
        phoneCountryCode: "",
        phoneNumber: "",
        expectedPhoneLength: 0,
        isPEP: "",
      },
    ]);
  };

  const removeDirector = (index: number) => {
    setDirectors((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDirector = (index: number, field: keyof Director, value: any) => {
    setDirectors((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const validate = () => {
    for (let d of directors) {
      if (!d.fullName.trim()) return false;
      if (!d.nationality) return false;
      if (!d.address.trim()) return false;
      if (!d.passportNumber.trim()) return false;
      if (!d.dateOfBirth) return false;
      if (!d.email.trim()) return false;
      if (!d.phoneCountryCode) return false;
      if (!d.phoneNumber) return false;
      if (
        d.expectedPhoneLength &&
        d.phoneNumber.length !== d.expectedPhoneLength
      )
        return false;
      if (!d.isPEP) return false;
    }
    return true;
  };

const submitForm3 = async () => {
  setError("");

  if (!validate()) {
    setError("⚠️ Please complete all required fields before continuing.");
    return;
  }

  try {
    // 1️⃣ Save directors to DB
    const res = await fetch("/api/company-incorporation/panama/board-of-directors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingId, data: directors })
    });

    if (!res.ok) throw new Error("Failed to save Panama directors");

    // 2️⃣ Ask server to create/find pending order
    const orderRes = await fetch("/api/incorporation/start-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onboardingId,
        jurisdiction,
        companyNames: {
          firstPreference: "Panama Company"
        }
      })
    });

    const json = await orderRes.json();
    if (!orderRes.ok) throw new Error(json.error || "Order error");

    // 3️⃣ Go to pricing
    router.push(json.pricingUrl);

  } catch (err) {
    console.error(err);
    setError("Unexpected error — please try again.");
  }
};


  const progress = (directors.length / 3) * 100;

  useDebouncedEffect(
    () => {
      if (process.env.NODE_ENV !== "production") return;
      if (!onboardingId) return;

      fetch(`/api/company-incorporation/panama/board-of-directors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingId,
          data: directors,
        }),
      });
    },
    [directors],
    800
  );

  return (
    <div className="max-w-4xl mx-auto py-10">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Panama — Board of Directors
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Progress Section */}
          <div className="space-y-3">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Form 3 of 3</span>
              <span>Board of Directors</span>
            </div>
          </div>

          {error && (
            <div className="text-sm bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-md">
              {error}
            </div>
          )}

          {/* Directors */}
          {directors.map((d, index) => (
            <div
              key={index}
              className="border rounded-lg p-6 bg-muted/20 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Director {index + 1}</h3>

                {index > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeDirector(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    className="bg-background"
                    value={d.fullName}
                    onChange={(e) =>
                      updateDirector(index, "fullName", e.target.value)
                    }
                  />
                </div>

                {/* Nationality */}
                <div className="space-y-2">
                  <Label>Nationality *</Label>
                  <SearchableCountrySelect
                    label="Nationality"
                    hideLabel
                    value={d.nationality}
                    onChange={(val) =>
                      updateDirector(index, "nationality", val)
                    }
                  />
                </div>

                {/* Passport Number */}
                <div className="space-y-2">
                  <Label>Passport Number *</Label>
                  <Input
                    className="bg-background"
                    value={d.passportNumber}
                    onChange={(e) =>
                      updateDirector(index, "passportNumber", e.target.value)
                    }
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Input
                    type="date"
                    className="bg-background"
                    value={d.dateOfBirth}
                    onChange={(e) =>
                      updateDirector(index, "dateOfBirth", e.target.value)
                    }
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    className="bg-background"
                    value={d.email}
                    onChange={(e) =>
                      updateDirector(index, "email", e.target.value)
                    }
                  />
                </div>

                {/* Address (full width) */}
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label>Residential Address *</Label>
                  <Textarea
                    className="bg-background"
                    value={d.address}
                    onChange={(e) =>
                      updateDirector(index, "address", e.target.value)
                    }
                  />
                </div>

                {/* Phone Number */}
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label>Phone Number *</Label>
                  <div className="flex gap-4">
                    <SearchableCountrySelect
                      label="Phone code"
                      hideLabel
                      showPhoneCode
                      value={d.phoneCountryCode}
                      onChange={(code, meta) => {
                        updateDirector(index, "phoneCountryCode", code);
                        updateDirector(
                          index,
                          "expectedPhoneLength",
                          meta?.phoneLength || 0
                        );
                      }}
                      className="w-40"
                    />

                    <Input
                      className="bg-background"
                      value={d.phoneNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        if (
                          d.expectedPhoneLength &&
                          digits.length > d.expectedPhoneLength
                        )
                          return;
                        updateDirector(index, "phoneNumber", digits);
                      }}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    Expected digits: {d.expectedPhoneLength || "—"}
                  </p>
                </div>

                {/* PEP */}
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label>Politically Exposed Person *</Label>
                  <div className="flex gap-6 items-center">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        className="h-4 w-4"
                        checked={d.isPEP === "yes"}
                        onChange={() => updateDirector(index, "isPEP", "yes")}
                      />
                      <span>Yes</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        className="h-4 w-4"
                        checked={d.isPEP === "no"}
                        onChange={() => updateDirector(index, "isPEP", "no")}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Director */}
          <Button variant="secondary" onClick={addDirector}>
            + Add Another Director
          </Button>

          {/* Final Submit */}
          <Button className="w-full" onClick={submitForm3}>
            Continue to Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
