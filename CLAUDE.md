This is a rough explaination of the application - not the excat one - reference from here and the actual code base for proper understanding

System Bird’s Eye View
The Analytics Engine system receives user queries in natural language and passes them to the Cognitive Core, which analyzes the associated databases through code generation and execution. This process may take a few seconds to several minutes, after which the system generates a response in Markdown.
When a user submits a query, it is first routed to the Ambiguity Resolver before reaching the Cognitive Core. The Ambiguity Resolver engages with the user to clarify domain-specific terms and concepts, maintaining a separate conversation for this purpose. Once the clarification is complete, it generates a final domain context for the Cognitive Core and displays it to the user. The full conversation (inputs and responses) is then passed to the Memory Unit, which stores them in the database for future reference.
The Ambiguity Resolver first utilizes the Memory Unit to search the database—filtered by metadata and refined with semantic search—to identify relevant past contexts in conversations domain specific knowledge. It then asks the user for confirmation on the proposed domain context. After confirmation, it resolves any remaining ambiguities, extends the conversation if necessary, and follows the same process as described above.
The system also intelligently retains conversational history by the Memory Unit, enabling context-aware interactions. For each new query, it generates a conversational context that is passed to both the Ambiguity Resolver.
Additionally, the system supports dynamic controllers for the analytics process, such as:
Processing time
Depth of analytics
Reporting style
Cross-validation intensity
These parameters are query-specific and can be adjusted dynamically.
It also includes fixed controllers, such as:
Title of analysis
Domain of analysis
These fixed parameters are requested once at the start of each new conversation and remain unchanged throughout.

UI–UX Overview
The UI should follow a modern, updated design for an agentic system. It must be simple yet appealing, ensuring clarity and a smooth user experience. The UX should feel intuitive, not complicated, with the use of icons and minimal text. The design must be responsive and adaptive, fitting all screen sizes. Proper font styles, sizes, and aesthetics should be applied consistently.
The main window will have three base components:
Left Panel
Main Window
Right Panel



1. Left Panel
Collapsible by default (expanded when first opened).


Header:
Fixed at the top with the label Agent Controls.
Includes an icon to collapse/expand the panel.


Controls (dynamic):
Processing Time: A circular dial ranging from 1 min to 30 min with suitable intervals.
Depth of Analytics: Options presented with an appropriate UI component.
Reporting Style: Options with a clean, modern design.
Verification Level: Options with a suitable design.
Toggle for In-Conversation Verification.
Toggle for Post-Conversation Verification.
Selected values persist throughout the specific conversation, with defaults set to moderate.
Advance Control: LLM Selection Dropdown: Choose which model to use, etc


Footer (fixed at bottom):
Displays the user’s name with a small circular profile image (or dummy placeholder if no photo is available).
On click, a menu expands with profile-related options (e.g., Profile, Logout, Settings).



2. Right Panel
Header:
Fixed at the top with a label representing Past Analytics Conversations.
Includes an icon to collapse/expand the panel.


Content:
Displays a clickable list of previous analytics (by title) for navigation.
If no history exists, display a placeholder message such as:
 “You are yet to start. Begin your first analysis to see it here.”



3. Main Window
Top Bar:
Left side:
A plus (+) icon to start a new analytics conversation.
If the left panel is collapsed, an additional control system icon should appear before the plus icon.
Center:
Displays the brand title:
brand logo (Blue Sherpa)
Subtitle: Analytics Engine


Right side:
A three-dot menu opening quick actions (Share Analytics, Export as PDF, etc.).
Add Share Analytics option:
Opens a popup with:
A dummy link + copy link icon.
Field for entering multiple email addresses.
Dropdown for access level: EDIT / COMMENT / VIEW.
Share button to confirm.
An icon to toggle the Right Panel.


Main Body:
New Conversation (before first query):
A form with:
Title of the Analytics (input field).
Domain selection dropdown (with the ability to add new domains for future use).
A Start Conversation button.


First Query Prompt:
Displays a short interactive message encouraging the user to enter their first query.
An input box with a send icon.


After First Input:
The input box moves to the bottom (fixed).
The main body transforms into a chat interface.
A cross icon button beside the input box (left side).Appears after the first user message. Ends the conversation and hides the input box for that thread.


Ambiguity Resolver:
If the response comes from the ambiguity resolver or any non-core agent, display it in a collapsible chat window inside the main chat.
The collapsible window will be titled Ambiguity resolver and follow a chat-style design.
The same input box (fixed at bottom) will be used to interact with the ambiguity manager.
Once resolved:
Display the final merged context (from both ambiguity manager and main conversation).
Provide a button to collapse the Context Manager section.
a “Resolved Context” badge/pill after the user confirms the context.


Processing State:


While the cognitive core is processing, display a placeholder loading GIF in the chat.
Add a “Force Stop” button (with icon) beside the Cognitive Core Processing GIF. Visible while the GIF is active. Vanishes once the GIF disappears and output is displayed.
sub-progress bars under the GIF with the following stages: Planning, Coding, In-Conversation Verification, Execution, Code-Fixing, Plan Optimization, Summarization
Add a collapsible section below the GIF to display various text responses/logs generated during execution. Collapses automatically once processing is complete (GIF vanishes and output is displayed).
Note: Processing log should not disappear with the GIF.
Once the response is received:
Remove the GIF.
Render the response in Markdown format (properly parsed).
With each agent's final response, add a verification badge (Pending / Verified / Partially Verified).
Input and agent control unfreezed for follow up queries which will again repeat the same cycle.
Add an edit prompt icon button (dummy, no functionality) next to the copy icon for user prompts.
Add a download log icon button (dummy, no functionality) with agent final response, next to copy and export i