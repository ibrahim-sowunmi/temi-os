import { auth } from "@/auth";
import { prisma } from "@/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { ProtectedClientComponent } from "@/app/components/ProtectedClientComponent";

import EditKnowledgeBaseButton from "../components/EditKnowledgeBaseButton";
import DeleteKnowledgeBaseButton from "../components/DeleteKnowledgeBaseButton";
import { KnowledgeBaseWithRelations, getScopeBadge } from "../utils";

export default async function KnowledgeBaseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // In Next.js 15, params is async and needs to be awaited
  const awaitedParams = await params;
  
  const session = await auth();
  if (!session?.user) {
    return <div>Not authenticated</div>;
  }

  const merchant = await prisma.merchant.findFirst({
    where: {
      userId: session.user.id,
    },
  });

  if (!merchant) {
    return <div>No merchant account found</div>;
  }

  const knowledgeBase = await prisma.knowledgeBase.findUnique({
    where: {
      id: awaitedParams.id,
      merchantId: merchant.id // Add merchant ID to ensure it belongs to this merchant
    },
    include: {
      merchant: {
        select: {
          id: true,
          businessName: true
        }
      },
      products: {
        select: {
          id: true,
          name: true,
        },
      },
      terminals: {
        select: {
          id: true,
          name: true,
        },
      },
      locations: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  }) as KnowledgeBaseWithRelations | null;

  if (!knowledgeBase) {
    notFound();
  }

  const scopeBadge = getScopeBadge(knowledgeBase.scope);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/knowledge"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Knowledge Base
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{knowledgeBase.title}</h1>
            <ProtectedClientComponent>
              <div className="flex space-x-3">
                <EditKnowledgeBaseButton knowledgeBase={knowledgeBase} />
                <DeleteKnowledgeBaseButton id={knowledgeBase.id} title={knowledgeBase.title} />
              </div>
            </ProtectedClientComponent>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Details</h2>
            </div>
            <div className="px-6 py-5">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 break-all">{knowledgeBase.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Title</dt>
                  <dd className="mt-1 text-sm text-gray-900">{knowledgeBase.title}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Scope</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scopeBadge.color}`}>
                      {scopeBadge.name}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${knowledgeBase.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {knowledgeBase.active ? "Active" : "Inactive"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tags</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {knowledgeBase.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {knowledgeBase.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">No tags</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(knowledgeBase.createdAt), "PPP")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(knowledgeBase.updatedAt), "PPP")}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Content</h2>
            </div>
            <div className="px-6 py-5 prose max-w-none">
              <div className="whitespace-pre-wrap">{knowledgeBase.content}</div>
            </div>
          </div>
        </div>

        {/* Right column / sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {knowledgeBase.scope === "GLOBAL" && "Global Knowledge Base"}
                {knowledgeBase.scope === "PRODUCT" && "Associated Products"}
                {knowledgeBase.scope === "READER" && "Associated Terminal Readers"}
                {knowledgeBase.scope === "LOCATION" && "Associated Locations"}
              </h2>
            </div>
            <div className="px-6 py-5">
              {knowledgeBase.scope === "GLOBAL" && (
                <p className="text-sm text-gray-500">
                  This is a global knowledge base that applies to all products, terminal readers, and locations.
                </p>
              )}

              {knowledgeBase.scope === "PRODUCT" && (
                <>
                  {knowledgeBase.products.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {knowledgeBase.products.map((product: { id: string; name: string }) => (
                        <li key={product.id} className="py-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <Link
                              href={`/products/${product.id}`}
                              className="text-sm text-blue-600 hover:text-blue-500"
                            >
                              View
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No products associated.</p>
                  )}
                </>
              )}

              {knowledgeBase.scope === "READER" && (
                <>
                  {knowledgeBase.terminals.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {knowledgeBase.terminals.map((terminal: { id: string; name: string | null }) => (
                        <li key={terminal.id} className="py-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {terminal.name || "Unnamed Reader"}
                            </p>
                            <Link
                              href={`/terminals/readers/${terminal.id}`}
                              className="text-sm text-blue-600 hover:text-blue-500"
                            >
                              View
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No terminal readers associated.</p>
                  )}
                </>
              )}

              {knowledgeBase.scope === "LOCATION" && (
                <>
                  {knowledgeBase.locations.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {knowledgeBase.locations.map((location: { id: string; displayName: string }) => (
                        <li key={location.id} className="py-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{location.displayName}</p>
                            <Link
                              href={`/terminals/locations/${location.id}`}
                              className="text-sm text-blue-600 hover:text-blue-500"
                            >
                              View
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No locations associated.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 