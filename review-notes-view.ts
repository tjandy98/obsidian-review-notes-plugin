import RecentNotesPlugin from "main";
import { ItemView, WorkspaceLeaf, addIcon, getIcon, Notice } from "obsidian";
import { RecentNotes } from "recent-notes-interface";

export const VIEW_TYPE_REVIEW_NOTES = "review-notes";

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
	async onOpen() {
		const container = this.containerEl.children[1];

		container.empty();
		container.createEl("h2", { text: "Review Notes" });

		const rootEl = createDiv({ cls: "recent-notes" });
		const childrenEl = rootEl.createDiv({ cls: "" });

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
						const leaf = this.app.workspace.getMostRecentLeaf();
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
