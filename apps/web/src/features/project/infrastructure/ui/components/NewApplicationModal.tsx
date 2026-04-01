import { memo, useState } from "react";
import { SourceType } from "@deploykit/shared";

import { Modal, Button, Input, Select } from "@shared/components";
import { ServerSelector } from "@project/infrastructure/ui/components/ServerSelector";

import { trpc } from "@lib/trpc";

import {
  BUILD_TYPE_OPTIONS,
  SOURCE_TYPE_OPTIONS,
} from "@project/infrastructure/ui/constants/project.module.constants";
import type { BuildTypeT } from "@project/infrastructure/ui/types/project.module.types";

interface NewApplicationModalPropsI {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onCreated: () => void;
}

export const NewApplicationModal: React.FC<NewApplicationModalPropsI> = memo(
  function NewApplicationModal({ open, onClose, projectId, onCreated }) {
    const [name, setName] = useState<string>("");
    const [sourceType, setSourceType] = useState<SourceType>("github");
    const [repoUrl, setRepoUrl] = useState<string>("");
    const [branch, setBranch] = useState<string>("main");
    const [buildType, setBuildType] = useState<BuildTypeT>("nixpacks");
    const [port, setPort] = useState<string>("3000");
    const [serverId, setServerId] = useState<string | null>(null);
    const [sourceToken, setSourceToken] = useState<string>("");
    const [rootDirectory, setRootDirectory] = useState<string>("");

    const createMutation = trpc.application.create.useMutation({
      onSuccess: () => {
        onCreated();
        resetForm();
      },
      onError: (err) => alert(err.message),
    });

    const resetForm = () => {
      setName("");
      setRepoUrl("");
      setRootDirectory("");
      setSourceToken("");
      setServerId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createMutation.mutate({
        projectId,
        name,
        sourceType,
        repositoryUrl: repoUrl || undefined,
        branch,
        sourceToken: sourceToken || undefined,
        rootDirectory: rootDirectory || undefined,
        buildType,
        port: parseInt(port) || undefined,
        serverId: serverId ?? undefined,
      });
    };

    const isGitSource = sourceType !== "docker_image";

    return (
      <Modal open={open} onClose={onClose} title="New Application">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-app"
            required
          />
          <Select
            label="Source"
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as SourceType)}
            options={SOURCE_TYPE_OPTIONS}
          />
          {isGitSource && (
            <>
              <Input
                label="Repository URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repo"
              />
              <Input
                label="Branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
              />
              <Input
                label="Access Token"
                value={sourceToken}
                onChange={(e) => setSourceToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
              />
              <Input
                label="Root Directory"
                value={rootDirectory}
                onChange={(e) => setRootDirectory(e.target.value)}
                placeholder="apps/web"
              />
              <p className="text-[11px] text-text-muted -mt-2">
                Subdirectory where the app lives. Leave empty if it's at the
                repo root.
              </p>
            </>
          )}
          <Select
            label="Build Type"
            value={buildType}
            onChange={(e) => setBuildType(e.target.value as BuildTypeT)}
            options={BUILD_TYPE_OPTIONS}
          />
          <Input
            label="Port"
            type="number"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="3000"
          />
          <ServerSelector value={serverId} onChange={setServerId} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Application"}
            </Button>
          </div>
        </form>
      </Modal>
    );
  },
);
