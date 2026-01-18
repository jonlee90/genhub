"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Hammer, DollarSign, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EntityPreviewSkeleton, EntityPreviewError } from "../EntityPreview";
import { useRouter } from "next/navigation";

interface MaterialPreviewProps {
  id: string;
}

interface MaterialData {
  id: string;
  product_name: string;
  unit_price: number;
  stock_status: string | null;
  product_image_url: string | null;
}

// Debug: Material preview card component
export function MaterialPreview({ id }: MaterialPreviewProps) {
  const [material, setMaterial] = useState<MaterialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  console.log("[MaterialPreview] Rendering for material:", id);

  // Debug: Fetch material data
  useEffect(() => {
    async function fetchMaterial() {
      console.log("[MaterialPreview] Fetching material data:", id);

      try {
        const response = await fetch(
          `/api/chat/entity-preview?type=material&id=${id}`,
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch material");
        }

        console.log("[MaterialPreview] Material data loaded:", data);
        setMaterial(data);
      } catch (err: any) {
        console.error("[MaterialPreview] Error fetching material:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMaterial();
  }, [id]);

  // Debug: Loading state
  if (isLoading) {
    return <EntityPreviewSkeleton />;
  }

  // Debug: Error state
  if (error || !material) {
    return <EntityPreviewError error={error || "Material not found"} />;
  }

  // Debug: Stock status badge variant
  const stockVariant = getStockVariant(material.stock_status);

  return (
    <motion.div
      onClick={() => router.push(`/app/materials?id=${id}`)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "w-full max-w-md bg-white border-2 border-construction-blue rounded-xl p-4",
        "hover:shadow-construction-lg transition-all duration-200 cursor-pointer",
        "group",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Debug: Product image or icon */}
        <div className="shrink-0">
          {material.product_image_url ? (
            <div className="w-16 h-16 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
              <Image
                src={material.product_image_url}
                alt={material.product_name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 flex items-center justify-center bg-construction-accent/10 rounded-lg border-2 border-construction-accent/20">
              <Hammer className="h-8 w-8 text-construction-accent" />
            </div>
          )}
        </div>

        {/* Debug: Product details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-construction-blue group-hover:text-blue-700 transition-colors mb-2">
            {material.product_name}
          </h3>

          {/* Debug: Price */}
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-construction-green" />
            <span className="text-xl font-black text-construction-green">
              ${material.unit_price.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500">per unit</span>
          </div>

          {/* Debug: Stock status */}
          {material.stock_status && (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <Badge
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5",
                  stockVariant.bg,
                  stockVariant.text,
                )}
              >
                {material.stock_status}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Debug: Footer hint */}
      <div className="mt-3 pt-3 border-t-2 border-gray-100">
        <p className="text-[10px] font-mono text-gray-500">
          Click to view material details
        </p>
      </div>
    </motion.div>
  );
}

// Debug: Helper function for stock status badge variants
function getStockVariant(stockStatus: string | null): {
  bg: string;
  text: string;
} {
  if (!stockStatus) return { bg: "bg-gray-200", text: "text-gray-700" };

  const variants: Record<string, { bg: string; text: string }> = {
    "in stock": {
      bg: "bg-construction-green/20",
      text: "text-construction-green",
    },
    "low stock": {
      bg: "bg-construction-yellow/20",
      text: "text-construction-yellow",
    },
    "out of stock": {
      bg: "bg-construction-red/20",
      text: "text-construction-red",
    },
  };

  return variants[stockStatus.toLowerCase()] || variants["in stock"];
}
