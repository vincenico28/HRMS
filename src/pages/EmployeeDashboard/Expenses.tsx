import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Loader2, UploadCloud, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExpenseClaims, useCreateExpenseClaim } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function useMyEmployee() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my_employee", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });
}

export default function Expenses() {
  const { data: employee, isLoading: employeeLoading } = useMyEmployee();
  const { data: claims = [], isLoading: claimsLoading } = useExpenseClaims();
  const createClaim = useCreateExpenseClaim();

  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const uploadReceipt = async (file: File) => {
    const reader = new FileReader();
    return new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        if (!reader.result) return reject(new Error("Failed to read receipt"));
        resolve(String(reader.result));
      };
      reader.onerror = () => reject(new Error("Failed to read receipt"));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee?.id) {
      toast.error("Employee profile not found");
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setSubmitting(true);

    let receiptUrl = null;
    if (receipt) {
      try {
        receiptUrl = await uploadReceipt(receipt);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Receipt upload failed";
        toast.error(message);
        setSubmitting(false);
        return;
      }
    }

    createClaim.mutate(
      {
        employee_id: employee.id,
        amount,
        description,
        receipt_url: receiptUrl,
        status: "pending",
        submitted_at: new Date().toISOString(),
        reviewed_by: null,
        reviewed_at: null,
      },
      {
        onSuccess: () => {
          toast.success("Expense claim submitted");
          setAmount(0);
          setDescription("");
          setReceipt(null);
          setSubmitting(false);
        },
        onError: (error: unknown) => {
          const message = error instanceof Error ? error.message : "Failed to submit claim";
          toast.error(message);
          setSubmitting(false);
        },
      }
    );
  };

  const filteredClaims = claims.filter((claim) => claim.employee_id === employee?.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Expense Claims</h1>
        <p className="text-muted-foreground">Submit receipt-backed expense claims for approval.</p>
      </div>

      {(employeeLoading || claimsLoading) ? (
        <div className="flex justify-center py-14"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>New Claim</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Receipt (image/pdf)</Label>
                  <input type="file" accept="image/*,.pdf" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Submit Claim"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Claims</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredClaims.length === 0 ? (
                <p className="text-muted-foreground">No expense claims yet.</p>
              ) : (
                <div className="space-y-3">
                  {filteredClaims.map((claim) => (
                    <div key={claim.id} className="border border-border rounded-lg p-3">
                      <div className="flex justify-between">
                        <p className="font-medium">{claim.description}</p>
                        <span className="text-xs text-muted-foreground capitalize">{claim.status}</span>
                      </div>
                      <p className="text-sm">Amount: {claim.amount}</p>
                      <p className="text-xs text-muted-foreground">Submitted: {new Date(claim.submitted_at).toLocaleString()}</p>
                      {claim.receipt_url && (
                        <a className="text-primary underline text-xs" href={claim.receipt_url} target="_blank" rel="noreferrer">View receipt</a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
