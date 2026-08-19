"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatZAR } from "@/lib/utils";

type RevisionItem = {
  nameSnapshot: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type QuotationRevisionData = {
  revisionNo: number;
  createdAt: string;
  subtotal: number;
  deliveryFee: number | null;
  total: number;
  message?: string;
  itemsSnapshot: RevisionItem[];
};

export function QuotationRevisionComparison({
  revisions
}: {
  revisions: QuotationRevisionData[];
}) {
  const [expandedRevision, setExpandedRevision] = useState<number | null>(null);

  if (!revisions || revisions.length === 0) {
    return <p className="text-sm text-charcoal-500">No revision history</p>;
  }

  // Get the two most recent revisions for comparison
  const current = revisions[0];
  const previous = revisions.length > 1 ? revisions[1] : null;

  const calculateDiff = (current: RevisionItem[], previous: RevisionItem[]) => {
    const diff: { added: RevisionItem[]; removed: RevisionItem[]; changed: { curr: RevisionItem; prev: RevisionItem }[] } = {
      added: [],
      removed: [],
      changed: []
    };

    const currentMap = new Map(current.map((item) => [item.nameSnapshot, item]));
    const previousMap = new Map(previous.map((item) => [item.nameSnapshot, item]));

    // Find added and changed items
    for (const [name, item] of currentMap) {
      const prev = previousMap.get(name);
      if (!prev) {
        diff.added.push(item);
      } else if (prev.quantity !== item.quantity || prev.unitPrice !== item.unitPrice) {
        diff.changed.push({ curr: item, prev });
      }
    }

    // Find removed items
    for (const [name, item] of previousMap) {
      if (!currentMap.has(name)) {
        diff.removed.push(item);
      }
    }

    return diff;
  };

  const diff = previous ? calculateDiff(current.itemsSnapshot, previous.itemsSnapshot) : null;

  return (
    <div className="mt-6 space-y-4">
      <h2 className="font-semibold text-charcoal-800">Revision History</h2>

      {/* Current Revision */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <div
          className="flex cursor-pointer items-center justify-between"
          onClick={() => setExpandedRevision(expandedRevision === 0 ? null : 0)}
        >
          <div className="flex-1">
            <p className="font-semibold text-charcoal-900">Revision {current.revisionNo} (Current)</p>
            <p className="text-xs text-charcoal-500">{new Date(current.createdAt).toLocaleString("en-ZA")}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-charcoal-900">{formatZAR(current.total)}</p>
            <p className="text-xs text-charcoal-500">{current.itemsSnapshot.length} items</p>
          </div>
          <ChevronDown
            className={`ml-2 h-4 w-4 transition-transform ${expandedRevision === 0 ? "rotate-180" : ""}`}
          />
        </div>

        {expandedRevision === 0 && (
          <div className="mt-3 space-y-2 border-t border-amber-200 pt-3">
            {current.itemsSnapshot.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-charcoal-700">
                  {item.nameSnapshot} × {item.quantity}
                </span>
                <span className="font-medium text-charcoal-900">{formatZAR(item.lineTotal)}</span>
              </div>
            ))}
            <div className="mt-2 border-t border-amber-200 pt-2">
              <div className="flex justify-between text-sm text-charcoal-600">
                <span>Subtotal</span>
                <span>{formatZAR(current.subtotal)}</span>
              </div>
              {current.deliveryFee != null && (
                <div className="flex justify-between text-sm text-charcoal-600">
                  <span>Delivery</span>
                  <span>{formatZAR(current.deliveryFee)}</span>
                </div>
              )}
            </div>
            {current.message && (
              <div className="mt-3 border-t border-amber-200 pt-3">
                <p className="text-xs font-semibold text-charcoal-700">Message:</p>
                <p className="mt-1 text-sm text-charcoal-600">{current.message}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Revisions with diff */}
      {revisions.map((revision, index) => {
        if (index === 0) return null; // Skip current, already shown above

        const isExpanded = expandedRevision === index;
        const isPrevious = index === 1;

        return (
          <div key={revision.revisionNo} className="rounded-xl border border-charcoal-100 bg-white p-4">
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => setExpandedRevision(isExpanded ? null : index)}
            >
              <div className="flex-1">
                <p className="font-medium text-charcoal-800">Revision {revision.revisionNo}</p>
                <p className="text-xs text-charcoal-500">{new Date(revision.createdAt).toLocaleString("en-ZA")}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-charcoal-700">{formatZAR(revision.total)}</p>
                <p className="text-xs text-charcoal-500">{revision.itemsSnapshot.length} items</p>
              </div>
              <ChevronDown
                className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
            </div>

            {isExpanded && (
              <div className="mt-3 space-y-2 border-t border-charcoal-100 pt-3">
                {revision.itemsSnapshot.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-charcoal-700">
                      {item.nameSnapshot} × {item.quantity}
                    </span>
                    <span className="font-medium text-charcoal-600">{formatZAR(item.lineTotal)}</span>
                  </div>
                ))}
                <div className="mt-2 border-t border-charcoal-100 pt-2">
                  <div className="flex justify-between text-sm text-charcoal-600">
                    <span>Subtotal</span>
                    <span>{formatZAR(revision.subtotal)}</span>
                  </div>
                  {revision.deliveryFee != null && (
                    <div className="flex justify-between text-sm text-charcoal-600">
                      <span>Delivery</span>
                      <span>{formatZAR(revision.deliveryFee)}</span>
                    </div>
                  )}
                </div>
                {revision.message && (
                  <div className="mt-3 border-t border-charcoal-100 pt-3">
                    <p className="text-xs font-semibold text-charcoal-700">Message:</p>
                    <p className="mt-1 text-sm text-charcoal-600">{revision.message}</p>
                  </div>
                )}

                {/* Diff summary if comparing with previous */}
                {isPrevious && diff && (diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0) && (
                  <div className="mt-3 border-t border-charcoal-100 pt-3">
                    <p className="text-xs font-semibold text-charcoal-700">Changes:</p>

                    {diff.added.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-green-600">Added:</p>
                        {diff.added.map((item, i) => (
                          <p key={i} className="text-xs text-green-700">
                            +{item.nameSnapshot} × {item.quantity}
                          </p>
                        ))}
                      </div>
                    )}

                    {diff.removed.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-red-600">Removed:</p>
                        {diff.removed.map((item, i) => (
                          <p key={i} className="text-xs text-red-700">
                            -{item.nameSnapshot} × {item.quantity}
                          </p>
                        ))}
                      </div>
                    )}

                    {diff.changed.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-amber-600">Changed:</p>
                        {diff.changed.map((change, i) => (
                          <p key={i} className="text-xs text-amber-700">
                            {change.curr.nameSnapshot}: {change.prev.quantity} → {change.curr.quantity} ×
                            {formatZAR(change.prev.unitPrice)} → {formatZAR(change.curr.unitPrice)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
