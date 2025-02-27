import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { format } from "date-fns";
import { Tooltip } from "@/app/components/Tooltip";
import { InfoIcon } from "lucide-react";
import { ProtectedClientComponent } from "@/app/components/ProtectedClientComponent";
import { KnowledgeBaseWithRelations, getScopeBadge, getAttachmentCount, getAttachmentDescription } from "./utils";
import AddKnowledgeBaseButton from "./components/AddKnowledgeBaseButton";
import Link from "next/link";

export default async function KnowledgeBasePage() {
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

  // Fetch all knowledge bases without filtering by merchant as the model doesn't have merchantId field
  const knowledgeBases = await prisma.knowledgeBase.findMany({
    include: {
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
    orderBy: {
      updatedAt: "desc",
    },
  }) as KnowledgeBaseWithRelations[];

  // Debug: Log knowledge bases count
  console.log(`Found ${knowledgeBases.length} knowledge bases`);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all knowledge base entries for your account.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <ProtectedClientComponent>
            <AddKnowledgeBaseButton />
          </ProtectedClientComponent>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {knowledgeBases.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No knowledge base entries found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by creating a new knowledge base entry.
            </p>
            <div className="mt-6">
              <ProtectedClientComponent>
                <AddKnowledgeBaseButton />
              </ProtectedClientComponent>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scope
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attachments
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {knowledgeBases.map((kb) => {
                  const scopeBadge = getScopeBadge(kb.scope);
                  return (
                    <tr key={kb.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          <Link href={`/knowledge/${kb.id}`} className="hover:text-blue-600 hover:underline">
                            {kb.title}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scopeBadge.color}`}>
                          {scopeBadge.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 flex items-center">
                          {getAttachmentCount(kb)}
                          <Tooltip content={getAttachmentDescription(kb)}>
                            <span className="ml-1">
                              <InfoIcon className="h-4 w-4 text-gray-400" />
                            </span>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {kb.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {kb.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800"
                                >
                                  {tag}
                                </span>
                              ))}
                              {kb.tags.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{kb.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(kb.updatedAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${kb.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {kb.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/knowledge/${kb.id}`}
                          className="text-blue-600 hover:text-blue-900 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 