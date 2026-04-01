import { memo, useState } from "react";
import { Key } from "lucide-react";

import { Button, Input, Modal, Textarea } from "@shared/components";

import { trpc } from "@lib/trpc";

interface AddServerModalPropsI {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const AddServerModal: React.FC<AddServerModalPropsI> = memo(
  function AddServerModal({ open, onClose, onCreated }) {
    const [name, setName] = useState<string>("");
    const [host, setHost] = useState<string>("");
    const [port, setPort] = useState<string>("22");
    const [username, setUsername] = useState<string>("root");
    const [keyMethod, setKeyMethod] = useState<"paste" | "path">("paste");
    const [sshKeyContent, setSshKeyContent] = useState<string>("");
    const [sshKeyPath, setSshKeyPath] = useState<string>("");

    const createMutation = trpc.server.create.useMutation({
      onSuccess: () => {
        resetForm();
        onCreated();
      },
    });

    const resetForm = () => {
      setName("");
      setHost("");
      setPort("22");
      setUsername("root");
      setSshKeyContent("");
      setSshKeyPath("");
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createMutation.mutate({
        name,
        host,
        port: parseInt(port),
        username,
        sshKeyContent:
          keyMethod === "paste" && sshKeyContent ? sshKeyContent : undefined,
        sshKeyPath: keyMethod === "path" && sshKeyPath ? sshKeyPath : undefined,
      });
    };

    return (
      <Modal open={open} onClose={onClose} title="Add Remote Server">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Server Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="production-1"
            required
          />
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="col-span-2">
              <Input
                label="Host / IP"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="192.168.1.100 or my-server.com"
                required
              />
            </div>
            <Input
              label="SSH Port"
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="22"
            />
          </div>
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="root"
          />

          {/* SSH Key Method */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-text-secondary">
              SSH Private Key
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setKeyMethod("paste")}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  keyMethod === "paste"
                    ? "bg-accent text-white"
                    : "bg-surface-2 text-text-secondary border border-border hover:bg-surface-3"
                }`}
              >
                Paste Key
              </button>
              <button
                type="button"
                onClick={() => setKeyMethod("path")}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  keyMethod === "path"
                    ? "bg-accent text-white"
                    : "bg-surface-2 text-text-secondary border border-border hover:bg-surface-3"
                }`}
              >
                Server Path
              </button>
            </div>

            {keyMethod === "paste" ? (
              <Textarea
                value={sshKeyContent}
                onChange={(e) => setSshKeyContent(e.target.value)}
                placeholder={
                  "-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----"
                }
                rows={5}
                className="font-mono text-xs"
              />
            ) : (
              <Input
                value={sshKeyPath}
                onChange={(e) => setSshKeyPath(e.target.value)}
                placeholder="/root/.ssh/id_rsa"
              />
            )}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-surface-2 border border-border">
            <Key className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
            <div className="text-xs text-text-muted space-y-1">
              <p>
                <strong>Paste Key:</strong> Paste your private key content. It
                will be encrypted in the database.
              </p>
              <p>
                <strong>Server Path:</strong> Path to the key on the DeployKit
                host (e.g. <code>~/.ssh/id_rsa</code>).
              </p>
            </div>
          </div>

          {createMutation.error && (
            <p className="text-xs text-danger">
              {createMutation.error.message}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Server"}
            </Button>
          </div>
        </form>
      </Modal>
    );
  },
);
