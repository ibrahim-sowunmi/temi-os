import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShoppingBag, Tag, Package, Clipboard, ArrowLeft } from "lucide-react";
import ProductImage from "../components/ProductImage";
import EditProductButton from "../components/EditProductButton";
import ProductMoreOptionsMenu from "../components/ProductMoreOptionsMenu";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const session = await auth();
  if (!session) return <div>Not authenticated</div>;

  // Get the merchant for the current user
  const merchant = await prisma.merchant.findFirst({
    where: {
      user: {
        email: session.user?.email || ""
      }
    }
  });

  if (!merchant) {
    return <div>Merchant account not found</div>;
  }

  // Properly await params before accessing
  const resolvedParams = await params;
  const productId = resolvedParams.id;
  
  // Get the product with its relations
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
      merchantId: merchant.id // Ensure product belongs to requesting merchant
    },
    include: {
      knowledgeBase: true
    }
  });

  if (!product) {
    return notFound();
  }

  // Helper function to format currency
  const formatCurrency = (amount: number | null, currency: string = "usd") => {
    if (amount === null) return "-";
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    });
    
    return formatter.format(amount / 100);
  };

  return (
    <div className="p-8">
      {/* Navigation and breadcrumb */}
      <div className="mb-3">
        <Link href="/products" className="text-blue-600 hover:underline flex items-center text-sm">
          <ArrowLeft className="h-3 w-3 mr-1" />
          Products
        </Link>
      </div>
      
      {/* Header with title, status and actions */}
      <div className="flex flex-col mb-8">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              product.status === "active" 
                ? "bg-green-100 text-green-800" 
                : product.status === "inactive" 
                  ? "bg-yellow-100 text-yellow-800" 
                  : "bg-red-100 text-red-800"
            }`}>
              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <EditProductButton product={product} />
            <ProductMoreOptionsMenu productId={product.id} productName={product.name} />
          </div>
        </div>
        {product.stripePriceId && (
          <div className="text-gray-500 text-sm">
            1 price
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column - Product image and basic details */}
        <div className="md:col-span-4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {product.images.length > 0 ? (
              <div>
                <ProductImage 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="w-full h-auto object-contain" 
                  style={{ maxHeight: "300px" }}
                  placeholderText="No Image"
                />
              </div>
            ) : (
              <div className="bg-gray-100 flex items-center justify-center" style={{ height: "200px" }}>
                <ShoppingBag className="h-16 w-16 text-gray-400" />
              </div>
            )}

            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Product Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Price:</span>
                  <span className="font-medium">{formatCurrency(product.price, product.currency || 'usd')}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Stripe Product ID:</span>
                  <span className="font-mono text-sm">{product.stripeProductId}</span>
                </div>
                {product.stripePriceId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Stripe Price ID:</span>
                    <span className="font-mono text-sm">{product.stripePriceId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span>{new Date(product.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated:</span>
                  <span>{new Date(product.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Detailed information */}
        <div className="md:col-span-8">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center mb-3">
              <Clipboard className="h-5 w-5 mr-2 text-gray-500" />
              <h2 className="text-xl font-semibold">Description</h2>
            </div>
            {product.description ? (
              <div className="prose max-w-none">
                <p>{product.description}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No description provided.</p>
            )}
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center mb-3">
              <Package className="h-5 w-5 mr-2 text-gray-500" />
              <h2 className="text-xl font-semibold">Inventory</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-gray-500 text-sm mb-1">Stock Status</p>
                <p className={`font-medium ${product.inStock ? "text-green-600" : "text-red-600"}`}>
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-gray-500 text-sm mb-1">Quantity</p>
                <p className="font-medium">
                  {product.stockQuantity !== null ? product.stockQuantity : "Not tracked"}
                </p>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center mb-3">
              <Tag className="h-5 w-5 mr-2 text-gray-500" />
              <h2 className="text-xl font-semibold">Categories</h2>
            </div>
            {product.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {product.categories.map((category, index) => (
                  <span 
                    key={index} 
                    className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                  >
                    {category}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No categories assigned.</p>
            )}
          </div>

          {/* Knowledge Base */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h2 className="text-xl font-semibold">Knowledge Base</h2>
            </div>
            {product.knowledgeBase ? (
              <div>
                <div className="mb-3">
                  <h3 className="font-medium text-lg">{product.knowledgeBase.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {product.knowledgeBase.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border p-4 mt-3 bg-gray-50">
                  <p className="text-gray-500 text-sm mb-2">Content Preview:</p>
                  <p className="text-sm line-clamp-3">{product.knowledgeBase.content}</p>
                </div>
                <div className="mt-4">
                  <Link 
                    href={`/knowledge/${product.knowledgeBaseId}`}
                    className="text-blue-600 hover:underline"
                  >
                    View Full Knowledge Base
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 italic mb-4">No knowledge base assigned to this product.</p>
                <Link 
                  href={`/knowledge/new?productId=${product.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Create Knowledge Base for this Product
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 