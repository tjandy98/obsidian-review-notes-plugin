import RecentNotesPlugin from "main";
import { ItemView, WorkspaceLeaf, getIcon, Notice } from "obsidian";
import { RecentNotes, File } from "recent-notes-interface";

export const VIEW_TYPE_REVIEW_NOTES = "review-notes";
type SortOrder = "ascending" | "descending";

export class ReviewNotesView extends ItemView {
	private plugin: RecentNotesPlugin;
	private recentNotes: RecentNotes;

	constructor(
		leaf: WorkspaceLeaf,
		recentNotes: RecentNotes,
		plugin: RecentNotesPlugin
	) {
		super(leaf);
		this.recentNotes = recentNotes;
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_REVIEW_NOTES;
	}

	getDisplayText() {
		return "Review Notes";
	}

	onload(): void {}

	removeExtension = (filename: string): string => {
		return filename.replace(/\.[^/.]+$/, "");
	};

	sortFiles = (files: File[], order: SortOrder): File[] => {
		return files.sort((a: File, b: File) => {
			const aWithoutExtension = this.removeExtension(a.filename);
			const bWithoutExtension = this.removeExtension(b.filename);

			if (order === "ascending") {
				return aWithoutExtension.localeCompare(bWithoutExtension);
			} else {
				return bWithoutExtension.localeCompare(aWithoutExtension);
			}
		});
	};

	async onOpen() {
		const container = this.containerEl.children[1];

		container.empty();
		container.createEl("h2", { text: "Review Notes" });

		const rootEl = createDiv({ cls: "recent-notes" });
		const childrenEl = rootEl.createDiv({ cls: "" });

		const navHeader = childrenEl.createDiv({ cls: "nav-header" });

		const navButtons = navHeader.createDiv({
			cls: "nav-buttons-container",
		});

		const navButtonSortAsc = navButtons.createDiv({
			cls: "clickable-icon nav-action-button",
			attr: {
				"aria-label": "Sort by file name (A to Z)",
			},
		});

		navButtonSortAsc.addEventListener(
			"click",
			async (event: MouseEvent) => {
				this.sortFiles(this.recentNotes.files, "ascending");
				await this.plugin.saveRecentNotes();
			}
		);

		const navButtonSortDesc = navButtons.createDiv({
			cls: "clickable-icon nav-action-button",
			attr: {
				"aria-label": "Sort by file name (Z to A)",
			},
		});

		navButtonSortDesc.addEventListener(
			"click",
			async (event: MouseEvent) => {
				this.sortFiles(this.recentNotes.files, "descending");
				await this.plugin.saveRecentNotes();
			}
		);

		const navButtonRemoveAll = navButtons.createDiv({
			cls: "clickable-icon nav-action-button",
			attr: {
				"aria-label": "Clear all recently modified notes",
			},
		});

		navButtonRemoveAll.addEventListener(
			"click",
			async (event: MouseEvent) => {
				this.recentNotes.files = [];
				await this.plugin.saveRecentNotes();

				new Notice(
					"All recently modified notes have been removed from the list"
				);
			}
		);
		navButtonSortAsc.appendChild(getIcon("sortAsc")!);
		navButtonSortDesc.appendChild(getIcon("sortDesc")!);
		navButtonRemoveAll.appendChild(getIcon("cross-in-box")!);

		this.recentNotes.files.forEach((file) => {
			const navFile = childrenEl.createDiv({
				cls: "nav-file",
			});
			const navFileTitle = navFile.createDiv({
				cls: "nav-file-title recent-notes-title",
			});
			const navFileTitleContent = navFileTitle.createDiv({
				cls: "nav-file-title-content recent-notes-content",
			});

			navFileTitleContent.setText(file.filename);

			// navFile.addEventListener("mouseover", (ev: MouseEvent) => {
			// 	// TODO: preview file path
			// });

			navFileTitleContent.addEventListener(
				"click",
				(event: MouseEvent) => {
					const _file = this.app.vault
						.getFiles()
						.find((f) => f.path === file.path);

					if (_file) {
						const leaf = this.app.workspace.getLeaf(false);
						if (leaf) {
							leaf.openFile(_file);
						}
					} else {
						new Notice(
							"File not found! It may have been deleted or its path modified."
						);
					}
				}
			);

			const removeButton = navFileTitle.createDiv({
				cls: "recent-notes-check",
			});
			removeButton.appendChild(getIcon("lucide-check")!);

			removeButton.addEventListener("click", async () => {
				this.recentNotes.files.splice(
					this.recentNotes.files.findIndex(
						(item) => item.path === file.path
					),
					1
				);

				await this.plugin.saveRecentNotes();
				this.onOpen();
			});
		});

		container.appendChild(rootEl);
	}

	async onClose() {
		// Nothing to clean up.
	}
}
