// What a project already holds, per file this CLI has more than one spelling of; one record, so `sync` and
// `create --skip-scaffold` discover the same files.
export interface ProjectShape {
  setupTests: readonly string[];
  styleEntries: readonly string[];
}

// Birth, or planning without reading disk.
export const EMPTY_PROJECT: ProjectShape = {
  setupTests: [],
  styleEntries: [],
};
