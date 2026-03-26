import { Suspense, lazy, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import { useAuthStore } from "@/store/auth";

const NotFoundPage = lazy(() => import("@/pages").then((module) => ({ default: module.NotFoundPage })));
const HomeDirectorPage = lazy(() => import("@/pages").then((module) => ({ default: module.HomeDirectorPage })));
const UserProfilePage = lazy(() => import("@/pages").then((module) => ({ default: module.UserProfilePage })));

const MainLayout = lazy(() => import("@/layouts").then((module) => ({ default: module.MainLayout })));
const AuthLayout = lazy(() => import("@/layouts").then((module) => ({ default: module.AuthLayout })));

const LoginPage = lazy(() => import("@/features/auth").then((module) => ({ default: module.LoginPage })));
const SignUpPage = lazy(() => import("@/features/auth").then((module) => ({ default: module.SignUpPage })));
const VerifyPage = lazy(() => import("@/features/auth").then((module) => ({ default: module.VerifyPage })));
const ForgotPasswordPage = lazy(() => import("@/features/auth/pages/ForgotPasswordPage").then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("@/features/auth/pages/ResetPasswordPage").then((module) => ({ default: module.ResetPasswordPage })));

const RoleManagement = lazy(() => import("@/features/roles").then((module) => ({ default: module.RoleManagement })));
const EntityManagement = lazy(() => import("@/features/entity").then((module) => ({ default: module.EntityManagement })));
const IntentManagementPage = lazy(() => import("@/features/intents").then((module) => ({ default: module.IntentManagementPage })));
const CreateIntentPage = lazy(() => import("@/features/intents").then((module) => ({ default: module.CreateIntentPage })));
const EditIntentPage = lazy(() => import("@/features/intents").then((module) => ({ default: module.EditIntentPage })));
const ResponseManagement = lazy(() => import("@/features/reponses").then((module) => ({ default: module.ResponseManagement })));
const ActionManagement = lazy(() => import("@/features/action").then((module) => ({ default: module.ActionManagement })));
const RuleManagementPage = lazy(() => import("@/features/rules").then((module) => ({ default: module.RuleManagementPage })));
const CreateRulePageSimple = lazy(() => import("@/features/rules").then((module) => ({ default: module.CreateRulePageSimple })));
const EditRulePageNew = lazy(() => import("@/features/rules").then((module) => ({ default: module.EditRulePageNew })));
const CreateDataPage = lazy(() => import("@/features/data-entry").then((module) => ({ default: module.CreateDataPage })));
const ImportIntentPage = lazy(() => import("@/features/data-entry").then((module) => ({ default: module.ImportIntentPage })));
const ImportBatchesPage = lazy(() => import("@/features/data-entry").then((module) => ({ default: module.ImportBatchesPage })));
const ChatBotManagement = lazy(() => import("@/features/chatbot").then((module) => ({ default: module.ChatBotManagement })));
const HomeChatDemo = lazy(() => import("@/features/chat/pages/HomeChatPageDemo").then((module) => ({ default: module.HomeChatDemo })));
const RagChatPage = lazy(() => import("@/features/chat/pages/RagChatPage").then((module) => ({ default: module.RagChatPage })));
const PermissionManagement = lazy(() => import("@/features/permissions/pages/PermissionManagement").then((module) => ({ default: module.PermissionManagement })));
const UserManagement = lazy(() => import("@/features/users/pages/UserManagement").then((module) => ({ default: module.UserManagement })));
const UQuestionManagement = lazy(() => import("@/features/uquestion/pages/UQuestionManagement").then((module) => ({ default: module.UQuestionManagement })));
const StoryManagementPage = lazy(() => import("@/features/stories/pages/StoryManagementPage").then((module) => ({ default: module.StoryManagementPage })));
const EditStoryPage = lazy(() => import("@/features/stories/pages/EditStoryPage").then((module) => ({ default: module.EditStoryPage })));
const CreateStoryPage = lazy(() => import("@/features/stories/pages/CreateStoryPage").then((module) => ({ default: module.CreateStoryPage })));
const DataInfoPage = lazy(() => import("@/features/data-info/pages/DataInfoPage"));
const DataInfoDetailPage = lazy(() => import("@/features/data-info/pages/DataInfoDetailPage"));
const TrainingManagementPage = lazy(() => import("@/features/training").then((module) => ({ default: module.TrainingManagementPage })));
const DocumentManagementPage = lazy(() => import("@/features/docs").then((module) => ({ default: module.DocumentManagementPage })));
const CreateDocumentPage = lazy(() => import("@/features/docs").then((module) => ({ default: module.CreateDocumentPage })));
const EditDocumentPage = lazy(() => import("@/features/docs").then((module) => ({ default: module.EditDocumentPage })));
const ContextDocumentsPage = lazy(() => import("@/features/context-docs").then((module) => ({ default: module.ContextDocumentsPage })));
const SettingsPage = lazy(() => import("@/features/settings").then((module) => ({ default: module.SettingsPage })));
const HelpCenterPage = lazy(() => import("@/features/help").then((module) => ({ default: module.HelpCenterPage })));
const UserStatisticsPage = lazy(() => import("@/features/statistics").then((module) => ({ default: module.UserStatisticsPage })));
const ConversationStatisticsPage = lazy(() => import("@/features/statistics").then((module) => ({ default: module.ConversationStatisticsPage })));
const ChatbotStatisticsPage = lazy(() => import("@/features/statistics").then((module) => ({ default: module.ChatbotStatisticsPage })));
const NLPStatisticsPage = lazy(() => import("@/features/statistics").then((module) => ({ default: module.NLPStatisticsPage })));
const DocumentStatisticsPage = lazy(() => import("@/features/statistics").then((module) => ({ default: module.DocumentStatisticsPage })));
const MessageFeedbackManagementPage = lazy(() =>
  import("@/features/message-feedback").then((module) => ({ default: module.MessageFeedbackManagementPage }))
);

function RouteLoader() {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center">
      <div className="surface-card flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading page...</span>
      </div>
    </div>
  );
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteLoader />}>{element}</Suspense>;
}

function AdminOnlyRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = Boolean(
    user?.roles?.some((role) => role.name?.toUpperCase() === "ADMIN")
  );

  if (!isAdmin) {
    return <Navigate to="/home_chat" replace />;
  }

  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(<MainLayout />),
    errorElement: withSuspense(<NotFoundPage />),
    children: [
      { index: true, element: withSuspense(<HomeDirectorPage />) },
      { path: "home_chat", element: withSuspense(<HomeChatDemo />) },
      { path: "home_chat_demo", element: withSuspense(<HomeChatDemo />) },
      { path: "users", element: withSuspense(<UserManagement />) },
      { path: "profile", element: withSuspense(<UserProfilePage />) },
      { path: "roles", element: withSuspense(<RoleManagement />) },
      { path: "permissions", element: withSuspense(<PermissionManagement />) },
      { path: "entities", element: withSuspense(<EntityManagement />) },
      {
        path: "intents",
        children: [
          { index: true, element: withSuspense(<IntentManagementPage />) },
          { path: "new", element: withSuspense(<CreateIntentPage />) },
          { path: "edit", element: withSuspense(<EditIntentPage />) },
        ],
      },
      { path: "actions", element: withSuspense(<ActionManagement />) },
      { path: "responses", element: withSuspense(<ResponseManagement />) },
      {
        path: "rules",
        children: [
          { index: true, element: withSuspense(<RuleManagementPage />) },
          { path: "new", element: withSuspense(<CreateRulePageSimple />) },
          { path: "edit", element: withSuspense(<EditRulePageNew />) },
        ],
      },
      {
        path: "add-data",
        children: [
          { index: true, element: withSuspense(<CreateDataPage />) },
          { path: "import", element: withSuspense(<ImportIntentPage />) },
          { path: "batches", element: withSuspense(<ImportBatchesPage />) },
        ],
      },
      {
        path: "chat_bot",
        element: withSuspense(
          <AdminOnlyRoute>
            <ChatBotManagement />
          </AdminOnlyRoute>
        ),
      },
      { path: "uquestion", element: withSuspense(<UQuestionManagement />) },
      { path: "message-feedback", element: withSuspense(<MessageFeedbackManagementPage />) },
      {
        path: "stories",
        children: [
          { index: true, element: withSuspense(<StoryManagementPage />) },
          { path: "new", element: withSuspense(<CreateStoryPage />) },
          { path: "edit", element: withSuspense(<EditStoryPage />) },
        ],
      },
      { path: "training", element: withSuspense(<TrainingManagementPage />) },
      { path: "data-info", element: withSuspense(<DataInfoPage />) },
      { path: "data-info/view", element: withSuspense(<DataInfoDetailPage />) },
      {
        path: "docs",
        children: [
          { index: true, element: withSuspense(<DocumentManagementPage />) },
          { path: "new", element: withSuspense(<CreateDocumentPage />) },
          { path: "edit", element: withSuspense(<EditDocumentPage />) },
        ],
      },
      { path: "context-docs", element: withSuspense(<ContextDocumentsPage />) },
      { path: "rag-chat", element: withSuspense(<RagChatPage />) },
      { path: "settings", element: withSuspense(<SettingsPage />) },
      { path: "help", element: withSuspense(<HelpCenterPage />) },
      {
        path: "statistics",
        children: [
          { path: "users", element: withSuspense(<UserStatisticsPage />) },
          { path: "conversations", element: withSuspense(<ConversationStatisticsPage />) },
          { path: "chatbots", element: withSuspense(<ChatbotStatisticsPage />) },
          { path: "nlp", element: withSuspense(<NLPStatisticsPage />) },
          { path: "documents", element: withSuspense(<DocumentStatisticsPage />) },
        ],
      },
    ],
  },
  {
    path: "/auth",
    element: withSuspense(<AuthLayout />),
    children: [
      {
        index: true,
        element: withSuspense(<LoginPage />),
      },
      {
        path: "register",
        element: withSuspense(<SignUpPage />),
      },
      {
        path: "verify",
        element: withSuspense(<VerifyPage />),
      },
      {
        path: "forgot-password",
        element: withSuspense(<ForgotPasswordPage />),
      },
      {
        path: "reset-password",
        element: withSuspense(<ResetPasswordPage />),
      },
    ],
  },
  { path: "*", element: withSuspense(<NotFoundPage />) },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
