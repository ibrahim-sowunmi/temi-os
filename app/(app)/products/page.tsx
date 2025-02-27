import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { PlusCircle } from "lucide-react";
import ProductImage from "./components/ProductImage";
import ProductActionsMenu from "./components/ProductActionsMenu";
import AuthProvider from "./components/AuthProvider";
import AddProductButton from "./components/AddProductButton";

export default async function ProductsPage() {
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

  // Get all products for this merchant
  const products = await prisma.product.findMany({
    where: {
      merchantId: merchant.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      knowledgeBase: {
        select: {
          id: true,
          title: true,
        }
      }
    }
  });

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <AuthProvider>
          <AddProductButton />
        </AuthProvider>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {products.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No Products Yet</h2>
            <p className="text-gray-500 mb-4">Get started by adding your first product.</p>
            <AuthProvider>
              <AddProductButton />
            </AuthProvider>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Knowledge Base</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.images.length > 0 ? (
                          <div className="flex-shrink-0 h-10 w-10 mr-3">
                            <ProductImage 
                              className="h-10 w-10 rounded-md object-cover"
                              src={product.images[0]} 
                              alt={product.name}
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center mr-3">
                            <span className="text-xs text-gray-500">No img</span>
                          </div>
                        )}
                        <div>
                          <Link 
                            href={`/products/${product.id}`} 
                            className="text-sm font-medium text-gray-900 hover:text-blue-600"
                          >
                            {product.name}
                          </Link>
                          {product.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {product.description.length > 50 
                                ? `${product.description.substring(0, 50)}...` 
                                : product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(product.price, product.currency || 'usd')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.status === "active" 
                          ? "bg-green-100 text-green-800" 
                          : product.status === "inactive" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-red-100 text-red-800"
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.inStock ? (
                        product.stockQuantity !== null ? (
                          <span>{product.stockQuantity} in stock</span>
                        ) : (
                          <span className="text-green-600">In stock</span>
                        )
                      ) : (
                        <span className="text-red-600">Out of stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.knowledgeBase ? (
                        <Link 
                          href={`/knowledge/${product.knowledgeBaseId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {product.knowledgeBase.title}
                        </Link>
                      ) : (
                        <span>None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end">
                        <Link 
                          href={`/products/${product.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-2"
                        >
                          View
                        </Link>
                        <ProductActionsMenu product={product} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 