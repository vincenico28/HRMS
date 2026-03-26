import { useState, useRef } from "react";
import { FolderOpen, Upload, FileText, Image, File, Trash2, Download, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEmployees } from "@/hooks/useSupabaseData";
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/useDocuments";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const typeIcons: Record<string, typeof FileText> = {
  contract: FileText,
  photo: Image,
  certificate: FileText,
  resume: File,
  other: File,
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const { data: documents, isLoading } = useDocuments();
  const { data: employees } = useEmployees();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState("other");
  const [employeeId, setEmployeeId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = documents?.filter(
    (d) => d.file_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = async () => {
    if (!file) return;
    try {
      await uploadDoc.mutateAsync({
        file,
        fileType,
        employeeId: employeeId || undefined,
      });
      toast({ title: "Document uploaded" });
      setUploadOpen(false);
      setFile(null);
      setFileType("other");
      setEmployeeId("");
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const doc = documents?.find((d) => d.id === deleteId);
    if (!doc) return;
    try {
      await deleteDoc.mutateAsync({ id: deleteId, storagePath: doc.storage_path });
      toast({ title: "Document deleted" });
      setDeleteId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDownload = async (doc: any) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.storage.from("documents").download(doc.storage_path);
    if (error) {
      toast({ title: "Download failed", description: error.message, variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage employee documents and files</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setUploadOpen(true)}>
          <Upload className="w-4 h-4" /> Upload Document
        </Button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search documents..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered?.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">No documents found</p>
          )}
          {filtered?.map((doc) => {
            const Icon = typeIcons[doc.file_type] || File;
            return (
              <div key={doc.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow animate-fade-in group">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-card-foreground truncate">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{doc.file_type} · {formatSize(doc.file_size)}</p>
                <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc)}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(doc.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>File</Label>
              <Input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="resume">Resume</SelectItem>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employee (optional)</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!file || uploadDoc.isPending}>
              {uploadDoc.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the document.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
