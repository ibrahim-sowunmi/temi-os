import { KnowledgeBaseScope } from "@prisma/client";

/**
 * Returns display name and style information for a knowledge base scope
 */
export function getScopeBadge(scope: KnowledgeBaseScope) {
  switch (scope) {
    case "GLOBAL":
      return { name: "Global", color: "bg-blue-100 text-blue-800" };
    case "PRODUCT":
      return { name: "Product", color: "bg-purple-100 text-purple-800" };
    case "READER":
      return { name: "Reader", color: "bg-green-100 text-green-800" };
    case "LOCATION":
      return { name: "Location", color: "bg-orange-100 text-orange-800" };
  }
}

/**
 * Returns a tooltip description for a knowledge base scope
 */
export function getScopeDescription(scope: KnowledgeBaseScope) {
  switch (scope) {
    case "GLOBAL":
      return "Applies to all entities";
    case "PRODUCT":
      return "Specific to certain products";
    case "READER":
      return "Specific to terminal readers";
    case "LOCATION":
      return "Specific to store locations";
  }
}

/**
 * Full Knowledge Base type with related entities
 */
export interface KnowledgeBaseWithRelations {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  scope: KnowledgeBaseScope;
  title: string;
  content: string;
  tags: string[];
  active: boolean;
  products: { id: string; name: string }[];
  terminals: { id: string; name: string | null }[];
  locations: { id: string; displayName: string }[];
}

/**
 * Returns the number of attached items based on scope
 */
export function getAttachmentCount(knowledgeBase: KnowledgeBaseWithRelations) {
  switch (knowledgeBase.scope) {
    case "GLOBAL":
      return "N/A";
    case "PRODUCT":
      return knowledgeBase.products.length.toString();
    case "READER":
      return knowledgeBase.terminals.length.toString();
    case "LOCATION":
      return knowledgeBase.locations.length.toString();
  }
}

/**
 * Returns attachment description based on scope
 */
export function getAttachmentDescription(knowledgeBase: KnowledgeBaseWithRelations) {
  switch (knowledgeBase.scope) {
    case "GLOBAL":
      return "Global knowledge bases apply to all entities";
    case "PRODUCT": {
      const count = knowledgeBase.products.length;
      return `Attached to ${count} product${count === 1 ? "" : "s"}`;
    }
    case "READER": {
      const count = knowledgeBase.terminals.length;
      return `Attached to ${count} terminal reader${count === 1 ? "" : "s"}`;
    }
    case "LOCATION": {
      const count = knowledgeBase.locations.length;
      return `Attached to ${count} location${count === 1 ? "" : "s"}`;
    }
  }
} 