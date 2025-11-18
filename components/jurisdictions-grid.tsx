"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Code (card) -> slug used in routes
const codeToSlug: Record<
  string,
  "bvi" | "cayman" | "panama" | "hongkong" | "singapore"
> = {
  BVI: "bvi",
  KY: "cayman",
  PA: "panama",
  HK: "hongkong",
  SG: "singapore",
};

// Slug -> token stored/expected by your forms & DB
const slugToToken: Record<
  string,
  "BVI" | "CAYMAN" | "PANAMA" | "HONGKONG" | "SINGAPORE"
> = {
  bvi: "BVI",
  cayman: "CAYMAN",
  panama: "PANAMA",
  hongkong: "HONGKONG",
  singapore: "SINGAPORE",
};

export function JurisdictionsGrid() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const jurisdictions = [
    {
      name: "British Virgin Islands",
      code: "BVI",
      flag: "🇻🇬",
      price: "$1,200",
      timeframe: "3-5 days",
      popular: true,
      features: [
        "No corporate tax",
        "Bearer shares allowed",
        "Flexible corporate structure",
        "Strong privacy protection",
      ],
      benefits: ["Tax neutral", "Privacy", "Flexibility", "Speed"],
    },
    {
      name: "Cayman Islands",
      code: "KY",
      flag: "🇰🇾",
      price: "$2,500",
      timeframe: "5-7 days",
      popular: true,
      features: [
        "No direct taxation",
        "Exempted company status",
        "Strong regulatory framework",
        "International recognition",
      ],
      benefits: ["Zero tax", "Reputation", "Regulation", "Recognition"],
    },
    {
      name: "Panama",
      code: "PA",
      flag: "🇵🇦",
      price: "$800",
      timeframe: "2-3 days",
      popular: false,
      features: [
        "Territorial tax system",
        "Bearer shares permitted",
        "No minimum capital",
        "Nominee services available",
      ],
      benefits: ["Low cost", "Speed", "Privacy", "Flexibility"],
    },
    {
      name: "Hong Kong",
      code: "HK",
      flag: "🇭🇰",
      price: "$1,500",
      timeframe: "7-10 days",
      popular: true,
      features: [
        "Gateway to China",
        "Strong banking sector",
        "International business hub",
        "Territorial tax system",
      ],
      benefits: ["Asia access", "Banking", "Business hub", "Tax efficient"],
    },
    {
      name: "Singapore",
      code: "SG",
      flag: "🇸🇬",
      price: "$1,800",
      timeframe: "5-7 days",
      popular: false,
      features: [
        "ASEAN headquarters",
        "Excellent infrastructure",
        "Strong legal system",
        "Tax incentives available",
      ],
      benefits: ["ASEAN hub", "Infrastructure", "Legal system", "Incentives"],
    },
  ];

  // PANAMA START FLOW
  const startPanamaCompany = async () => {
    const slug = "panama";

    // User not logged in → go to login
    if (!session) {
      router.push(`/login?callbackUrl=/incorporate/${slug}`);
      return;
    }

    try {
      // Step 1: try lookup draft
      const res = await fetch(`/api/incorporation/lookup?jurisdiction=panama`, {
        cache: "no-store",
      });

      if (res.ok) {
        const info = await res.json();

        if (info.found && info.status === "draft" && info.onboardingId) {
          router.push(
            `/company-incorporation/panama/legal-entity?onboardingId=${info.onboardingId}&jurisdiction=panama`
          );
          return;
        }
      }
    } catch (err) {
      console.error("PANAMA lookup error:", err);
    }

    // Step 2: start new onboarding
    try {
      const startRes = await fetch(
        `/api/incorporation/start?jurisdiction=panama`,
        {
          method: "POST",
        }
      );
      const startData = await startRes.json();

      if (startData?.onboardingId) {
        router.push(
          `/company-incorporation/panama/legal-entity?onboardingId=${startData.onboardingId}&jurisdiction=panama`
        );
        return;
      }
    } catch (err) {
      console.error("PANAMA start error:", err);
    }

    router.push("/error");
  };

  const startSingaporeCompany = async () => {
    const slug = "singapore";

    // Not logged in → go to login
    if (!session) {
      const callbackUrl = `/incorporate/${slug}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    // 1) Check existing draft
    try {
      const res = await fetch(
        `/api/incorporation/lookup?jurisdiction=${slug}`,
        {
          cache: "no-store",
        }
      );

      if (res.ok) {
        const info = await res.json();

        if (info.found && info.status === "draft" && info.onboardingId) {
          router.push(
            `/company-incorporation/singapore?onboardingId=${info.onboardingId}&jurisdiction=singapore`
          );
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }

    // 2) No draft → start fresh
    try {
      const start = await fetch(
        `/api/incorporation/start?jurisdiction=singapore`,
        {
          method: "POST",
        }
      );

      const data = await start.json();

      if (data?.onboardingId) {
        router.push(
          `/company-incorporation/singapore?onboardingId=${data.onboardingId}&jurisdiction=singapore`
        );
        return;
      }
    } catch (err) {
      console.error(err);
    }

    router.push(`/error`);
  };

  // MAIN HANDLER
  const handleStartCompany = async (jurisdictionCode: string) => {
    if (status === "loading") return;

    const slug = codeToSlug[jurisdictionCode] || "bvi";

    if (slug === "panama") {
      return startPanamaCompany();
    }

    if (slug === "singapore") {
      return startSingaporeCompany();
    }

    // Non-Panama jurisdictions:
    if (!session) {
      router.push(`/login?callbackUrl=/incorporate/${slug}`);
      return;
    }

    try {
      const res = await fetch(
        `/api/incorporation/lookup?jurisdiction=${slug}`,
        { cache: "no-store" }
      );

      if (res.ok) {
        const info = await res.json();

        if (info.found && info.status === "draft" && info.onboardingId) {
          const token = info.token || slugToToken[slug] || "BVI";
          router.push(
            `/company-incorporation?onboardingId=${info.onboardingId}&jurisdiction=${token}`
          );
          return;
        }
      }

      router.push(`/incorporate/${slug}`);
    } catch (e) {
      router.push(`/incorporate/${slug}`);
    }
  };

  // UI Rendering
  return (
    <section id="jurisdictions" className="py-24 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Filter your needs, order online, pay in{" "}
            <span className="gradient-text">crypto or fiat</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Incorporate a legal entity within days in all major locations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {jurisdictions.map((jurisdiction, index) => (
            <Card
              key={index}
              className={`glass-effect hover:bg-slate-900/60 transition-all duration-300 group relative ${
                jurisdiction.popular ? "ring-2 ring-primary/50" : ""
              }`}
            >
              {jurisdiction.popular && (
                <Badge className="absolute -top-3 left-4 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-3xl">{jurisdiction.flag}</div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {jurisdiction.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      starting from
                    </div>
                  </div>
                </div>
                <CardTitle className="text-xl">{jurisdiction.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {jurisdiction.timeframe} incorporation
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Key Features:</h4>
                  <ul className="space-y-1">
                    {jurisdiction.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center text-sm text-muted-foreground"
                      >
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  {jurisdiction.benefits.map((benefit, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs bg-primary/10 text-primary"
                    >
                      {benefit}
                    </Badge>
                  ))}
                </div>

                <Button
                  className="w-full py-2.5 text-sm bg-gray-600 hover:bg-gray-700 text-white"
                  onClick={() => handleStartCompany(jurisdiction.code)}
                  disabled={status === "loading"}
                >
                  {status === "loading"
                    ? "Loading..."
                    : `Start ${jurisdiction.code} Company`}
                </Button>

                {session && (
                  <form action="/resume" method="post">
                    <input
                      type="hidden"
                      name="preferredJurisdiction"
                      value={codeToSlug[jurisdiction.code] || "bvi"}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      className="w-full py-2.5 text-sm"
                    >
                      Resume {jurisdiction.code} Application
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ))}

          <Card className="glass-effect flex items-center justify-center min-h-[400px]">
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Need Something Else?</CardTitle>
              <CardDescription>
                Looking for a different jurisdiction or custom structure?
              </CardDescription>
              <Button variant="outline">Speak with Expert</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
