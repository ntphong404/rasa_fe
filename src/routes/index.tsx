import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { HomeDirectorPage, NotFoundPage, UserProfilePage } from "@/pages";
import { AuthLayout, MainLayout } from "@/layouts";
import { LoginPage, SignUpPage, VerifyPage } from "@/features/auth";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { HomeChat } from "@/features/chat/pages/HomeChatPage";
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
import { ChatBotManagement } from "@/features/chatbot";
import { HomeChatDemo } from "@/features/chat/pages/HomeChatPageDemo";
import { PermissionManagement } from "@/features/permissions/pages/PermissionManagement";
import { UserManagement } from "@/features/users/pages/UserManagement";
import { UQuestionManagement } from "@/features/uquestion/pages/UQuestionManagement";
import { StoryManagementPage } from "@/features/stories/pages/StoryManagementPage";
import { EditStoryPage } from "@/features/stories/pages/EditStoryPage";
import { CreateStoryPage } from "@/features/stories/pages/CreateStoryPage";
import { TrainingManagementPage } from "@/features/training";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomeDirectorPage /> },
      { path: "home_chat", element: <HomeChatDemo /> },
      // { path: "home_chat", element: <HomeChat /> },
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
