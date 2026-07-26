"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BadgePercent,
  ChevronRight,
  MessageSquare,
  ShoppingCart,
  ThumbsUp,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { ProductCard } from "@/components/product-card";
import { Footer } from "@/components/footer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product } from "@/lib/types";
import { useCartStore } from "@/lib/store";
import { API_BASE_URL } from "@/lib/config";
import { authFetch } from "@/lib/auth-fetch";

type ApiProduct = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  stock: number;
  originalPrice?: number | string | null;
  imageUrl?: string | null;
  images?: string[] | null;
  imageUrls?: string[] | null;
  rating?: number | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  ratingBreakdown?: {
    oneStarCount?: number | null;
    twoStarCount?: number | null;
    threeStarCount?: number | null;
    fourStarCount?: number | null;
    fiveStarCount?: number | null;
  } | null;
  commentsByStar?: {
    oneStarComments?: unknown[] | null;
    twoStarComments?: unknown[] | null;
    threeStarComments?: unknown[] | null;
    fourStarComments?: unknown[] | null;
    fiveStarComments?: unknown[] | null;
    oneStar?: unknown[] | null;
    twoStar?: unknown[] | null;
    threeStar?: unknown[] | null;
    fourStar?: unknown[] | null;
    fiveStar?: unknown[] | null;
  } | null;
  reviews?: Array<{
    id?: string;
    rating?: number;
    comment?: string;
    imageUrls?: string[];
    createdAt?: string;
    user?: {
      id?: string;
      name?: string;
    };
  }> | null;
  brand?: string | null;
  highlights?: string[] | null;
  specifications?: Record<string, string> | null;
  returnPolicy?: string | null;
  warranty?: string | null;
  returnWindowDays?: number | null;
  warrantyMonths?: number | null;
  dispatchInHours?: number | null;
  sku?: string | null;
  category?: {
    id?: string;
    name?: string;
  } | null;
  vendor?: {
    id?: string;
    businessName?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

type ProductDetailResponse = {
  status: string;
  data?: ApiProduct;
};

type ApiOffer = {
  id: string;
  offerName: string;
  discountPercentage: number;
  couponCode?: string | null;
  termsAndConditions?: string | null;
  startAt: string;
  endAt: string;
  isActive: boolean;
  isFlashDeal: boolean;
  productId: string;
};

type ProductOffersResponse = {
  status: string;
  data?: ApiOffer[];
};

type ProductDetailViewModel = Product & {
  originalPrice: number;
  discountPercent: number;
  brandName: string;
  specifications: Array<{ label: string; value: string }>;
  returnPolicy: string;
  warranty: string;
  dispatchInHours: number;
  sku: string;
  ratingBreakdown: {
    oneStarCount: number;
    twoStarCount: number;
    threeStarCount: number;
    fourStarCount: number;
    fiveStarCount: number;
  };
  commentsByStar: {
    oneStarComments: ReviewItem[];
    twoStarComments: ReviewItem[];
    threeStarComments: ReviewItem[];
    fourStarComments: ReviewItem[];
    fiveStarComments: ReviewItem[];
  };
};

type ReviewItem = {
  id: string;
  author: string;
  title: string;
  comment: string;
  date: string;
  helpful: number;
  imageUrls: string[];
};

type ReviewFormState = {
  rating: number;
  comment: string;
  imageFiles: File[];
};

type ReviewFormErrors = {
  rating?: string;
  comment?: string;
  imageFiles?: string;
  submit?: string;
};

const formatReviewDate = (rawDate: unknown): string => {
  if (typeof rawDate !== "string" || rawDate.trim().length === 0) {
    return "Recent";
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return "Recent";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getStarTitle = (star: number) => {
  const clampedStar = Math.min(5, Math.max(1, Math.round(star)));
  return `${"★".repeat(clampedStar)}${"☆".repeat(5 - clampedStar)}`;
};

const isStarOnlyTitle = (value: string) => /^[★☆]+$/.test(value.trim());

const normalizeReviewItem = (
  value: unknown,
  star: number,
  index: number,
): ReviewItem | null => {
  if (typeof value === "string") {
    const commentText = value.trim();
    if (!commentText) return null;

    return {
      id: `${star}-comment-${index}`,
      author: "Verified customer",
      title: getStarTitle(star),
      comment: commentText,
      date: "Recent",
      helpful: 0,
      imageUrls: [],
    };
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const commentText =
    (typeof source.comment === "string" && source.comment.trim()) ||
    (typeof source.text === "string" && source.text.trim()) ||
    (typeof source.review === "string" && source.review.trim()) ||
    (typeof source.message === "string" && source.message.trim()) ||
    "";

  if (!commentText) {
    return null;
  }

  const author =
    (typeof source.author === "string" && source.author.trim()) ||
    (typeof source.customerName === "string" && source.customerName.trim()) ||
    (typeof source.userName === "string" && source.userName.trim()) ||
    (typeof (source.user as { name?: unknown })?.name === "string" &&
      ((source.user as { name?: string }).name || "").trim()) ||
    (typeof source.name === "string" && source.name.trim()) ||
    "Verified customer";

  const title =
    (typeof source.title === "string" && source.title.trim()) ||
    (typeof source.heading === "string" && source.heading.trim()) ||
    getStarTitle(star);

  const helpfulValue = Number(
    source.helpful ?? source.helpfulCount ?? source.likes ?? 0,
  );

  const imageUrls = Array.isArray(source.imageUrls)
    ? source.imageUrls
        .filter((url): url is string => typeof url === "string")
        .map((url) => url.trim())
        .filter((url) => url.length > 0)
        .slice(0, 5)
    : [];

  return {
    id:
      (typeof source.id === "string" && source.id.trim()) ||
      `${star}-comment-${index}`,
    author,
    title,
    comment: commentText,
    date: formatReviewDate(source.createdAt ?? source.date),
    helpful: Number.isFinite(helpfulValue) ? Math.max(0, helpfulValue) : 0,
    imageUrls,
  };
};

const getCommentsForStar = (
  commentsByStar: ApiProduct["commentsByStar"],
  star: 1 | 2 | 3 | 4 | 5,
): ReviewItem[] => {
  if (!commentsByStar) {
    return [];
  }

  const keyMap: Record<1 | 2 | 3 | 4 | 5, [string, string]> = {
    1: ["oneStarComments", "oneStar"],
    2: ["twoStarComments", "twoStar"],
    3: ["threeStarComments", "threeStar"],
    4: ["fourStarComments", "fourStar"],
    5: ["fiveStarComments", "fiveStar"],
  };

  const [preferredKey, fallbackKey] = keyMap[star];
  const preferredCandidate =
    commentsByStar[
      preferredKey as keyof NonNullable<ApiProduct["commentsByStar"]>
    ];
  const fallbackCandidate =
    commentsByStar[
      fallbackKey as keyof NonNullable<ApiProduct["commentsByStar"]>
    ];

  const preferredArray = Array.isArray(preferredCandidate)
    ? preferredCandidate
    : [];
  const fallbackArray = Array.isArray(fallbackCandidate)
    ? fallbackCandidate
    : [];

  const commentsCandidate =
    fallbackArray.length > 0 ? fallbackArray : preferredArray;

  if (commentsCandidate.length === 0) {
    return [];
  }

  return commentsCandidate
    .map((entry, index) => normalizeReviewItem(entry, star, index))
    .filter((entry): entry is ReviewItem => Boolean(entry));
};

const getCommentsFromReviews = (
  reviews: NonNullable<ApiProduct["reviews"]>,
) => {
  const grouped = {
    oneStarComments: [] as ReviewItem[],
    twoStarComments: [] as ReviewItem[],
    threeStarComments: [] as ReviewItem[],
    fourStarComments: [] as ReviewItem[],
    fiveStarComments: [] as ReviewItem[],
  };

  reviews.forEach((review, index) => {
    const starRaw = Number(review?.rating);
    const star =
      Number.isFinite(starRaw) && starRaw >= 1 && starRaw <= 5
        ? (starRaw as 1 | 2 | 3 | 4 | 5)
        : 5;

    const normalized = normalizeReviewItem(review, star, index);
    if (!normalized) return;

    if (star === 1) grouped.oneStarComments.push(normalized);
    else if (star === 2) grouped.twoStarComments.push(normalized);
    else if (star === 3) grouped.threeStarComments.push(normalized);
    else if (star === 4) grouped.fourStarComments.push(normalized);
    else grouped.fiveStarComments.push(normalized);
  });

  return grouped;
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<ProductDetailViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isBuyNowHovered, setIsBuyNowHovered] = useState(false);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [vendorProductsLoading, setVendorProductsLoading] = useState(false);
  const [productOffers, setProductOffers] = useState<ApiOffer[]>([]);
  const [productOffersLoading, setProductOffersLoading] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>({
    rating: 5,
    comment: "",
    imageFiles: [],
  });
  const [reviewErrors, setReviewErrors] = useState<ReviewFormErrors>({});
  const [reviewFileInputKey, setReviewFileInputKey] = useState(0);

  const productId = useMemo(() => {
    const value = params?.id;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const mapApiProductToUi = (item: ApiProduct): ProductDetailViewModel => {
    const imageCandidates = [
      ...(Array.isArray(item.images) ? item.images : []),
      ...(Array.isArray(item.imageUrls) ? item.imageUrls : []),
      item.imageUrl || "",
    ]
      .map((img) => (typeof img === "string" ? img.trim() : ""))
      .filter((img) => img.length > 0);

    const images =
      imageCandidates.length > 0
        ? Array.from(new Set(imageCandidates))
        : ["/placeholder-product-1.jpg"];

    const safePrice = Number(item.price || 0);
    const rawOriginalPrice = Number(item.originalPrice || 0);
    const originalPrice = rawOriginalPrice > safePrice ? rawOriginalPrice : 0;

    const discountPercent =
      originalPrice > safePrice && safePrice > 0
        ? Math.round(((originalPrice - safePrice) / originalPrice) * 100)
        : 0;

    const dispatchInHours = Math.max(12, Number(item.dispatchInHours || 24));

    const returnPolicy =
      item.returnPolicy && item.returnPolicy.trim().length > 0
        ? item.returnPolicy.trim()
        : Number.isFinite(Number(item.returnWindowDays))
          ? `${Math.max(1, Number(item.returnWindowDays))}-day easy return`
          : "Return policy available at checkout";

    const warranty =
      item.warranty && item.warranty.trim().length > 0
        ? item.warranty.trim()
        : Number.isFinite(Number(item.warrantyMonths))
          ? `${Math.max(1, Number(item.warrantyMonths))} months`
          : "Warranty details available at checkout";

    const sku =
      item.sku && item.sku.trim().length > 0
        ? item.sku.trim()
        : `MF-${item.id.slice(0, 8).toUpperCase()}`;

    const categoryName = item.category?.name || "Uncategorized";
    const vendorName = item.vendor?.businessName || "Unknown Vendor";

    const specEntries =
      item.specifications && typeof item.specifications === "object"
        ? Object.entries(item.specifications).filter(
            ([label, value]) =>
              label.trim().length > 0 && value.trim().length > 0,
          )
        : [];

    const brandName =
      item.brand && item.brand.trim().length > 0 ? item.brand : "Not specified";

    const specifications =
      specEntries.length > 0
        ? specEntries.slice(0, 8).map(([label, value]) => ({ label, value }))
        : [
            { label: "Brand", value: brandName },
            { label: "Category", value: categoryName },
            { label: "Warranty", value: warranty },
            {
              label: "Return Policy",
              value: returnPolicy,
            },
            { label: "Dispatch", value: `Within ${dispatchInHours} hours` },
            { label: "SKU", value: sku },
          ];

    const oneStarCount = Math.max(
      0,
      Number(item.ratingBreakdown?.oneStarCount ?? 0) || 0,
    );
    const twoStarCount = Math.max(
      0,
      Number(item.ratingBreakdown?.twoStarCount ?? 0) || 0,
    );
    const threeStarCount = Math.max(
      0,
      Number(item.ratingBreakdown?.threeStarCount ?? 0) || 0,
    );
    const fourStarCount = Math.max(
      0,
      Number(item.ratingBreakdown?.fourStarCount ?? 0) || 0,
    );
    const fiveStarCount = Math.max(
      0,
      Number(item.ratingBreakdown?.fiveStarCount ?? 0) || 0,
    );

    const breakdownTotal =
      oneStarCount +
      twoStarCount +
      threeStarCount +
      fourStarCount +
      fiveStarCount;

    const ratingValue = Number(item.averageRating ?? item.rating);
    const reviewCountValue = Number(item.reviewCount);

    const rating = Number.isFinite(ratingValue)
      ? Math.min(5, Math.max(0, ratingValue))
      : 0;

    const reviewCount = Number.isFinite(reviewCountValue)
      ? Math.max(0, reviewCountValue)
      : breakdownTotal;

    const commentsByStar =
      Array.isArray(item.reviews) && item.reviews.length > 0
        ? getCommentsFromReviews(item.reviews)
        : {
            oneStarComments: getCommentsForStar(item.commentsByStar, 1),
            twoStarComments: getCommentsForStar(item.commentsByStar, 2),
            threeStarComments: getCommentsForStar(item.commentsByStar, 3),
            fourStarComments: getCommentsForStar(item.commentsByStar, 4),
            fiveStarComments: getCommentsForStar(item.commentsByStar, 5),
          };

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: safePrice,
      originalPrice,
      images,
      category: categoryName,
      subcategory: categoryName,
      stock: Number(item.stock || 0),
      vendorId: item.vendor?.id || "",
      vendorName,
      rating,
      reviewCount,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      featured: true,
      discountPercent,
      brandName,
      specifications,
      returnPolicy,
      warranty,
      dispatchInHours,
      sku,
      ratingBreakdown: {
        oneStarCount,
        twoStarCount,
        threeStarCount,
        fourStarCount,
        fiveStarCount,
      },
      commentsByStar,
    };
  };

  useEffect(() => {
    let active = true;

    const fetchProduct = async () => {
      if (!productId) {
        setError("Invalid product id");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
          method: "GET",
        });

        const payload: ProductDetailResponse = await response
          .json()
          .catch(() => ({ status: "error" }));

        if (!response.ok || payload.status !== "success" || !payload.data) {
          throw new Error("Failed to load product details");
        }

        if (!active) return;
        setProduct(mapApiProductToUi(payload.data));
      } catch (err: unknown) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Unable to fetch product";
        setError(message);
        setProduct(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product?.id]);

  useEffect(() => {
    let active = true;

    const fetchProductOffers = async () => {
      if (!productId) {
        setProductOffers([]);
        return;
      }

      setProductOffersLoading(true);

      try {
        const response = await fetch(
          `${API_BASE_URL}/flash-deals/non-flash/product/${productId}`,
          {
            method: "GET",
          },
        );

        const payload: ProductOffersResponse = await response
          .json()
          .catch(() => ({ status: "error" }));

        if (!active) return;

        if (response.ok && payload.status === "success" && payload.data) {
          setProductOffers(payload.data);
          return;
        }

        setProductOffers([]);
      } catch {
        if (!active) return;
        setProductOffers([]);
      } finally {
        if (active) {
          setProductOffersLoading(false);
        }
      }
    };

    fetchProductOffers();

    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!product?.vendorName) return;
    let active = true;

    const fetchVendorProducts = async () => {
      setVendorProductsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/products?businessName=${encodeURIComponent(product.vendorName)}`,
        );
        const payload = await response.json();
        if (response.ok && payload.status === "success" && active) {
          const mapped = (payload.data || []).map(
            (item: ApiProduct): Product => ({
              id: item.id,
              name: item.name,
              description: item.description,
              price: Number(item.price || 0),
              images: item.imageUrl
                ? [item.imageUrl]
                : ["/placeholder-product-1.jpg"],
              category: item.category?.name || "Uncategorized",
              subcategory: item.category?.name || "General",
              stock: Number(item.stock || 0),
              vendorId: item.vendor?.id || "",
              vendorName: item.vendor?.businessName || "Unknown Vendor",
              rating: Number.isFinite(Number(item.averageRating ?? item.rating))
                ? Math.min(
                    5,
                    Math.max(0, Number(item.averageRating ?? item.rating)),
                  )
                : 0,
              reviewCount: Number.isFinite(Number(item.reviewCount))
                ? Math.max(0, Number(item.reviewCount))
                : 0,
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: item.updatedAt || new Date().toISOString(),
              featured: true,
            }),
          );
          setVendorProducts(mapped.filter((p: Product) => p.id !== product.id));
        }
      } catch (err) {
        console.error("Failed to fetch vendor products", err);
      } finally {
        if (active) setVendorProductsLoading(false);
      }
    };

    fetchVendorProducts();
    return () => {
      active = false;
    };
  }, [product?.vendorName, product?.id]);

  const handleAddToCart = () => {
    if (!product || quantity < 1 || product.stock === 0) {
      return;
    }

    const safeQuantity = Math.min(quantity, product.stock);

    addItem({
      productId: product.id,
      quantity: safeQuantity,
      price: product.price,
      product,
    });
  };

  const handleBuyNow = () => {
    if (!product || quantity < 1 || product.stock === 0) {
      return;
    }

    handleAddToCart();

    const user = useAuthStore.getState().user;
    if (!user) {
      router.push(`/login?returnUrl=${encodeURIComponent("/customer/checkout")}`);
      return;
    }

    router.push("/customer/checkout");
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(price);

  const galleryImages = useMemo(() => {
    if (!product) {
      return ["/placeholder-product-1.jpg"];
    }

    const baseImages = product.images.length
      ? product.images
      : ["/placeholder-product-1.jpg"];
    const expanded = [...baseImages];

    while (expanded.length < 4) {
      expanded.push(baseImages[expanded.length % baseImages.length]);
    }

    return expanded.slice(0, 4);
  }, [product]);

  const activeImage = galleryImages[selectedImageIndex] || galleryImages[0];

  const reviewBreakdown = useMemo(() => {
    const counts = [
      product?.ratingBreakdown.fiveStarCount ?? 0,
      product?.ratingBreakdown.fourStarCount ?? 0,
      product?.ratingBreakdown.threeStarCount ?? 0,
      product?.ratingBreakdown.twoStarCount ?? 0,
      product?.ratingBreakdown.oneStarCount ?? 0,
    ];

    const total =
      product?.reviewCount && product.reviewCount > 0
        ? product.reviewCount
        : counts.reduce((sum, count) => sum + count, 0);

    return [5, 4, 3, 2, 1].map((star, index) => ({
      star,
      count: counts[index],
      percent:
        total > 0 ? Math.round((Number(counts[index]) / total) * 100) : 0,
    }));
  }, [
    product?.ratingBreakdown.fiveStarCount,
    product?.ratingBreakdown.fourStarCount,
    product?.ratingBreakdown.threeStarCount,
    product?.ratingBreakdown.twoStarCount,
    product?.ratingBreakdown.oneStarCount,
    product?.reviewCount,
  ]);

  const reviewComments = useMemo<ReviewItem[]>(() => {
    if (!product) return [];

    return [
      ...product.commentsByStar.fiveStarComments,
      ...product.commentsByStar.fourStarComments,
      ...product.commentsByStar.threeStarComments,
      ...product.commentsByStar.twoStarComments,
      ...product.commentsByStar.oneStarComments,
    ];
  }, [product]);

  const resetReviewForm = () => {
    setReviewForm({
      rating: 5,
      comment: "",
      imageFiles: [],
    });
    setReviewErrors({});
    setReviewFileInputKey((prev) => prev + 1);
  };

  const handleOpenReviewDialog = () => {
    resetReviewForm();
    setIsReviewDialogOpen(true);
  };

  const validateReviewForm = (
    formState: ReviewFormState,
  ): { errors: ReviewFormErrors } => {
    const errors: ReviewFormErrors = {};
    const ratingNumber = Number(formState.rating);

    if (!Number.isFinite(ratingNumber) || ratingNumber < 1) {
      errors.rating = "Rating must be at least 1";
    } else if (ratingNumber > 5) {
      errors.rating = "Rating must be at most 5";
    }

    const trimmedComment = formState.comment.trim();
    if (trimmedComment.length > 2000) {
      errors.comment = "Comment must be at most 2000 characters";
    }

    if (formState.imageFiles.length > 5) {
      errors.imageFiles = "You can upload at most 5 images";
    }

    const invalidFile = formState.imageFiles.find(
      (file) => !file.type.startsWith("image/"),
    );
    if (invalidFile) {
      errors.imageFiles = "Only image files are allowed";
    }

    return { errors };
  };

  const handleSubmitReview = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!productId) {
      setReviewErrors({ submit: "Invalid product id" });
      return;
    }

    const { errors } = validateReviewForm(reviewForm);
    if (Object.keys(errors).length > 0) {
      setReviewErrors(errors);
      return;
    }

    setReviewSubmitting(true);
    setReviewErrors({});

    try {
      const payload = new FormData();
      payload.append("rating", String(Number(reviewForm.rating)));

      const trimmedComment = reviewForm.comment.trim();
      if (trimmedComment.length > 0) {
        payload.append("comment", trimmedComment);
      }

      reviewForm.imageFiles.slice(0, 5).forEach((file) => {
        payload.append("images", file);
      });

      const response = await authFetch(
        `${API_BASE_URL}/products/${productId}/rate`,
        {
          method: "POST",
          body: payload,
        },
      );

      const responsePayload: ProductDetailResponse & {
        message?: string;
        error?: string;
      } = await response.json().catch(() => ({ status: "error" }));

      if (
        !response.ok ||
        responsePayload.status !== "success" ||
        !responsePayload.data
      ) {
        throw new Error(
          responsePayload.message ||
            responsePayload.error ||
            "Unable to submit your review. Please try again.",
        );
      }

      setProduct(mapApiProductToUi(responsePayload.data));
      setIsReviewDialogOpen(false);
      resetReviewForm();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to submit your review. Please try again.";
      setReviewErrors({ submit: message });
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <span className="opacity-30">/</span>
            <Link
              href="/products"
              className="hover:text-black transition-colors"
            >
              Catalogue
            </Link>
            <span className="opacity-30">/</span>
            <span className="text-black">{product?.name || "Product"}</span>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="aspect-square bg-[var(--bg-sunken)] rounded-xl" />
              <div className="space-y-6">
                <div className="h-10 bg-[var(--bg-sunken)] rounded w-3/4" />
                <div className="h-6 bg-[var(--bg-sunken)] rounded w-1/4" />
                <div className="h-24 bg-[var(--bg-sunken)] rounded w-full" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="py-20 text-center rounded-xl border border-[var(--border-default)] bg-white shadow-sm">
            <h2 className="text-xl font-black text-black uppercase tracking-tight">
              Product unavailable
            </h2>
            <p className="mt-2 text-[var(--text-secondary)] text-sm">{error}</p>
            <Link
              href="/products"
              className="mt-8 px-8 py-3 inline-block bg-black text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-accent)] transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        ) : product ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="flex flex-col-reverse sm:flex-row gap-4 items-start w-full">
                {/* Left Side Vertical Thumbnails (Amazon Style) */}
                <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[560px] w-full sm:w-auto shrink-0 pb-2 sm:pb-0 scrollbar-hide">
                  {galleryImages.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      onClick={() => setSelectedImageIndex(index)}
                      onMouseEnter={() => setSelectedImageIndex(index)}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                        selectedImageIndex === index
                          ? "border-[var(--brand-accent)] ring-2 ring-[var(--brand-accent)]/20 shadow-sm scale-95 opacity-100"
                          : "border-[var(--border-default)] hover:border-black/30 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>

                {/* Main Product Display Image (Direct display without card wrapper) */}
                <div className="relative aspect-square w-full max-w-[560px] overflow-hidden group flex-1">
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    className="object-contain transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  {product.stock < 5 && product.stock > 0 && (
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-0.5 bg-[var(--destructive)] text-[9px] font-black text-white uppercase tracking-tighter rounded shadow">
                      Low Stock
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <section className="space-y-3 rounded-md border border-[var(--border-default)] bg-white p-6">
                  <h1 className="text-3xl sm:text-[2rem] font-black text-black leading-tight tracking-tight">
                    {product.name}
                  </h1>

                  <p className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <span>{product.rating.toFixed(1)}</span>
                    <span className="text-red-600 tracking-tight" aria-hidden>
                      {"★".repeat(
                        Math.min(5, Math.max(0, Math.round(product.rating))),
                      )}
                      {"☆".repeat(
                        5 -
                          Math.min(5, Math.max(0, Math.round(product.rating))),
                      )}
                    </span>
                    <span>|</span>
                    <span>{formatPrice(product.reviewCount)} reviews</span>
                  </p>

                  <div className="flex flex-wrap items-end gap-3 pt-1">
                    <p className="text-4xl font-black text-black tracking-tight">
                      ₹{formatPrice(product.price)}
                    </p>
                    {product.originalPrice > product.price && (
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-lg line-through text-zinc-400 font-bold">
                          ₹{formatPrice(product.originalPrice)}
                        </p>
                        {product.discountPercent > 0 && (
                          <span className="px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-black">
                            {product.discountPercent}% OFF
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quantity and Compact Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
                    <div className="flex items-center gap-2 shrink-0 bg-zinc-50 border border-[var(--border-default)] rounded-lg px-3 py-1 h-11">
                      <label className="text-[11px] font-black uppercase tracking-wider text-[var(--text-muted)] shrink-0">
                        Qty:
                      </label>
                      <select
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="h-full bg-transparent text-sm font-bold outline-none cursor-pointer text-black"
                        disabled={product.stock === 0}
                      >
                        {[...Array(Math.min(30, product.stock || 1))].map(
                          (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <button
                        onClick={handleAddToCart}
                        disabled={product.stock === 0}
                        className="h-11 flex items-center justify-center gap-2 bg-[var(--brand-accent)] hover:bg-red-700 text-white rounded-lg font-bold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-30"
                      >
                        <ShoppingCart size={16} />
                        Add to Cart
                      </button>
                      <button
                        onClick={handleBuyNow}
                        disabled={product.stock === 0}
                        className="h-11 flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 text-white rounded-lg font-bold text-sm transition-all shadow-sm active:scale-95 disabled:opacity-30"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </section>

                <section className="rounded-md border border-[var(--border-default)] bg-white p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-black">
                    <BadgePercent
                      size={16}
                      className="text-[var(--brand-accent)]"
                    />
                    Offers running on this product
                  </div>
                  <ul className="space-y-2">
                    {productOffersLoading ? (
                      <li className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        Loading active offers...
                      </li>
                    ) : productOffers.length > 0 ? (
                      productOffers.map((offer) => (
                        <li
                          key={offer.id}
                          className="text-sm text-[var(--text-secondary)] leading-relaxed flex items-start gap-2"
                        >
                          <ChevronRight
                            className="h-4 w-4 text-[var(--brand-accent)] mt-0.5 shrink-0"
                            aria-hidden
                          />
                          <span>
                            {offer.offerName}: {offer.discountPercentage}% off
                            {offer.couponCode
                              ? ` (Code: ${offer.couponCode})`
                              : ""}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        No active offers on this product right now.
                      </li>
                    )}
                  </ul>
                </section>

                <section className="rounded-md border border-[var(--border-default)] bg-white p-6 space-y-5">
                  <h2 className="text-xl font-black text-black tracking-tight">
                    Product details
                  </h2>

                  <div className="space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-muted)]">
                      Description
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                      {product.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-muted)]">
                      Product specifications
                    </h3>
                    <div className="border border-[var(--border-default)] rounded-lg overflow-hidden divide-y divide-[var(--border-default)]">
                      {product.specifications.map((spec, i) => (
                        <div
                          key={i}
                          className={`grid grid-cols-2 gap-3 px-4 py-3 text-sm ${
                            i % 2 === 0 ? "bg-white" : "bg-zinc-50/70"
                          }`}
                        >
                          <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[11px]">
                            {spec.label}
                          </span>
                          <span className="font-bold text-black text-xs sm:text-sm">
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <section className="rounded-md border border-[var(--border-default)] bg-white p-6 sm:p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-black tracking-tight">
                  Customer reviews and comments
                </h2>
                <span className="text-sm text-[var(--text-secondary)] font-semibold">
                  {formatPrice(product.reviewCount)} global ratings
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-8">
                <div className="space-y-5">
                  <div>
                    <p className="text-4xl font-black text-black leading-none">
                      {product.rating.toFixed(1)}
                    </p>
                    <p className="text-sm mt-1 text-[var(--text-secondary)] font-semibold">
                      out of 5
                    </p>
                  </div>

                  <div className="space-y-3">
                    {reviewBreakdown.map((item) => (
                      <div
                        key={item.star}
                        className="grid grid-cols-[56px_1fr_44px] gap-3 items-center"
                      >
                        <span className="text-sm font-semibold text-[var(--text-secondary)]">
                          {item.star} star
                        </span>
                        <div className="h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
                          <div
                            className="h-full bg-[var(--brand-accent)]"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-[var(--text-secondary)] text-right">
                          {item.percent}%
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[var(--border-default)] space-y-3">
                    <h3 className="text-2xl font-black text-black tracking-tight">
                      Review this product
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Share your thoughts with other customers.
                    </p>
                    <button
                      onClick={handleOpenReviewDialog}
                      className="w-full h-11 rounded-full border border-[var(--border-default)] text-sm font-semibold hover:bg-[var(--secondary)] transition-colors"
                    >
                      Write a product review
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {reviewComments.length > 0 ? (
                    reviewComments.map((comment) => (
                      <article
                        key={comment.id}
                        className="rounded-lg border border-[var(--border-default)] p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p
                              className={`text-base font-black ${
                                isStarOnlyTitle(comment.title)
                                  ? "text-red-600"
                                  : "text-black"
                              }`}
                            >
                              {comment.title}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                              {comment.author} • {comment.date}
                            </p>
                          </div>
                          <MessageSquare className="h-5 w-5 text-[var(--brand-accent)] shrink-0" />
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                          {comment.comment}
                        </p>

                        {comment.imageUrls.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {comment.imageUrls.map((url, imageIndex) => (
                              <a
                                key={`${comment.id}-img-${imageIndex}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative h-16 w-16 overflow-hidden rounded-md border border-[var(--border-default)]"
                                aria-label={`Open review image ${imageIndex + 1}`}
                              >
                                <Image
                                  src={url}
                                  alt={`Review image ${imageIndex + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {comment.helpful} people found this helpful
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-lg border border-[var(--border-default)] p-6 text-sm text-[var(--text-secondary)]">
                      No customer comments yet for this product.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {(vendorProducts.length > 0 || vendorProductsLoading) && (
              <section className="pt-4 border-t border-[var(--border-default)] space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                    You may also like
                  </h2>
                  <Link
                    href="/products"
                    className="text-xs font-black text-[var(--brand-accent)] uppercase tracking-widest hover:underline"
                  >
                    Explore all
                  </Link>
                </div>

                {vendorProductsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((key) => (
                      <div
                        key={key}
                        className="h-44 rounded-xl bg-[var(--secondary)] animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {vendorProducts.map((vp) => (
                      <ProductCard key={vp.id} product={vp} compact />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        ) : null}
      </div>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-black tracking-tight">
              Rate this product
            </DialogTitle>
            <DialogDescription className="text-sm text-[var(--text-secondary)]">
              Share your rating and comment. You can also upload up to 5 images.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">
                Rating
              </label>
              <select
                value={reviewForm.rating}
                onChange={(event) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    rating: Number(event.target.value),
                  }))
                }
                className="w-full h-11 rounded-lg border border-[var(--border-default)] bg-white px-3 text-sm font-semibold"
              >
                {[5, 4, 3, 2, 1].map((star) => (
                  <option key={star} value={star}>
                    {star} star{star > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              {reviewErrors.rating ? (
                <p className="text-xs text-red-600">{reviewErrors.rating}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">
                Comment (optional)
              </label>
              <textarea
                value={reviewForm.comment}
                onChange={(event) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    comment: event.target.value,
                  }))
                }
                maxLength={2000}
                rows={5}
                placeholder="Write your product experience"
                className="w-full rounded-lg border border-[var(--border-default)] bg-white px-3 py-2 text-sm"
              />
              <p className="text-[11px] text-[var(--text-muted)]">
                {reviewForm.comment.trim().length}/2000
              </p>
              {reviewErrors.comment ? (
                <p className="text-xs text-red-600">{reviewErrors.comment}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wide text-[var(--text-muted)]">
                Images (optional)
              </label>
              <input
                key={reviewFileInputKey}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    imageFiles: Array.from(event.target.files || []).slice(
                      0,
                      5,
                    ),
                  }))
                }
                className="w-full rounded-lg border border-[var(--border-default)] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[var(--brand-accent)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
              />
              {reviewForm.imageFiles.length > 0 ? (
                <p className="text-[11px] text-[var(--text-muted)]">
                  {reviewForm.imageFiles.length}/5 selected:{" "}
                  {reviewForm.imageFiles.map((file) => file.name).join(", ")}
                </p>
              ) : null}
              {reviewErrors.imageFiles ? (
                <p className="text-xs text-red-600">
                  {reviewErrors.imageFiles}
                </p>
              ) : null}
            </div>

            {reviewErrors.submit ? (
              <p className="text-sm text-red-600">{reviewErrors.submit}</p>
            ) : null}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsReviewDialogOpen(false)}
                className="h-10 px-4 rounded-full border border-[var(--border-default)] text-sm font-semibold"
                disabled={reviewSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-10 px-5 rounded-full bg-[var(--brand-accent)] text-white text-sm font-semibold disabled:opacity-60"
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? "Submitting..." : "Submit review"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
