import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HomeDirectorPage, NotFoundPage, UserProfilePage } from "@/pages";
import { AuthLayout, MainLayout } from "@/layouts";
import { LoginPage, SignUpPage, VerifyPage } from "@/features/auth";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { RoleManagement } from "@/features/roles";
import { EntityManagement } from "@/features/entity";
import {
  CreateIntentPage,
  EditIntentPage,
  IntentManagementPage,
} from "@/features/intents";
import { ResponseManagement } from "@/features/reponses";
import { ActionManagement } from "@/features/action";
import {
  CreateRulePageSimple,
  EditRulePageNew,
  RuleManagementPage,
} from "@/features/rules";
import { CreateDataPage, ImportIntentPage } from "@/features/data-entry";
import { ChatBotManagement } from "@/features/chatbot";
import { HomeChatDemo } from "@/features/chat/pages/HomeChatPageDemo";
import { PermissionManagement } from "@/features/permissions/pages/PermissionManagement";
import { UserManagement } from "@/features/users/pages/UserManagement";
import { UQuestionManagement } from "@/features/uquestion/pages/UQuestionManagement";
import { StoryManagementPage } from "@/features/stories/pages/StoryManagementPage";
import { EditStoryPage } from "@/features/stories/pages/EditStoryPage";
import { CreateStoryPage } from "@/features/stories/pages/CreateStoryPage";
import DataInfoPage from "@/features/data-info/pages/DataInfoPage";
import DataInfoDetailPage from "@/features/data-info/pages/DataInfoDetailPage";
import { TrainingManagementPage } from "@/features/training";
import {
  DocumentManagementPage,
  CreateDocumentPage,
  EditDocumentPage,
} from "@/features/docs";
import { RagChatPage } from "@/features/chat/pages/RagChatPage";
import { ContextDocumentsPage } from "@/features/context-docs";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomeDirectorPage /> },
      { path: "home_chat", element: <HomeChatDemo /> },
      { path: "home_chat_demo", element: <HomeChatDemo /> },
      { path: "users", element: <UserManagement /> },
      { path: "profile", element: <UserProfilePage /> },
      { path: "roles", element: <RoleManagement /> },
      { path: "permissions", element: <PermissionManagement /> },
      { path: "entities", element: <EntityManagement /> },
      { path: "users", element: <UserManagement /> },
      {
        path: "intents",
        children: [
          { index: true, element: <IntentManagementPage /> },
          { path: "new", element: <CreateIntentPage /> },
          { path: "edit", element: <EditIntentPage /> },
        ],
      },
      { path: "actions", element: <ActionManagement /> },
      { path: "responses", element: <ResponseManagement /> },
      {
        path: "rules",
        children: [
          { index: true, element: <RuleManagementPage /> },
          { path: "new", element: <CreateRulePageSimple /> },
          { path: "edit", element: <EditRulePageNew /> },
        ],
      },
      // Data entry independent routes
      {
        path: "add-data",
        children: [
          { index: true, element: <CreateDataPage /> },
          { path: "import", element: <ImportIntentPage /> },
        ],
      },
      { path: "responses", element: <ResponseManagement /> },
      { path: "actions", element: <ActionManagement /> },
      { path: "chat_bot", element: <ChatBotManagement /> },
      { path: "uquestion", element: <UQuestionManagement /> },
      {
        path: "stories",
        children: [
          { index: true, element: <StoryManagementPage /> },
          { path: "new", element: <CreateStoryPage /> },
          { path: "edit", element: <EditStoryPage /> },
        ],
      },
      { path: "training", element: <TrainingManagementPage /> },
      { path: "data-info", element: <DataInfoPage /> },
      { path: "data-info/view", element: <DataInfoDetailPage /> },
      {
        path: "docs",
        children: [
          { index: true, element: <DocumentManagementPage /> },
          { path: "new", element: <CreateDocumentPage /> },
          { path: "edit", element: <EditDocumentPage /> },
        ],
      },
      { path: "context-docs", element: <ContextDocumentsPage /> },
      { path: "rag-chat", element: <RagChatPage /> },
    ],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <SignUpPage />,
      },
      {
        path: "verify",
        element: <VerifyPage />,
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },
  // {
  //   path: "/",
  //   element: <MainLayout />,
  //   errorElement: <NotFoundPage />,
  //   children: [{ path: "home_chat", index: true, element: <HomeChat /> }],
  // },
  { path: "*", element: <NotFoundPage /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
