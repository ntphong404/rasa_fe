import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  AppWindow,
  Archive,
  Bell,
  CalendarIcon,
  Eye,
  EyeOff,
  RotateCcw,
  Settings,
  Shield,
  SlidersHorizontal,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useMe } from "@/hooks/useMe";
import { useAuthStore } from "@/store/auth";
import { Calendar } from "@/components/ui/calendar";
import { chatService } from "@/features/chat/api/service";
import { IConversation } from "@/interfaces/chat.interface";

const profileSchema = z.object({
  firstName: z.string().min(1, "Tên không được để trống"),
  lastName: z.string().min(1, "Họ không được để trống"),
  phoneNumber: z.string().min(1, "Số điện thoại không được để trống"),
  dateOfBirth: z.string().min(1, "Ngày sinh không được để trống"),
  address: z.string().min(1, "Địa chỉ không được để trống"),
  gender: z.string().min(1, "Giới tính không được để trống"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const UserProfilePage = () => {
  const { t } = useTranslation();
  //   const {
  //     getProfile,
  //     updateProfile,
  //     updateAvatar,
  //     updatePassword,
  //   } = useUser();

  //   const user = useUserStore((state) => state.user);
  //   const setUser = useUserStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  const { getMe, updateMe } = useMe();

  const [isEditing, setIsEditing] = useState(false);

  // Dialog để đổi avatar
  const [openAvatarDialog, setOpenAvatarDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Dialog để đổi mật khẩu
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError] = useState("");
  const [archivedConversations, setArchivedConversations] = useState<IConversation[]>([]);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [busyConversationId, setBusyConversationId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [openDataControlDialog, setOpenDataControlDialog] = useState(false);
  const [dataControlTab, setDataControlTab] = useState<
    "general" | "notice" | "personal" | "apps" | "data" | "security" | "account"
  >("data");
  const [unarchiveDialogOpen, setUnarchiveDialogOpen] = useState(false);
  const [deleteArchivedDialogOpen, setDeleteArchivedDialogOpen] = useState(false);
  const [selectedArchivedConversation, setSelectedArchivedConversation] = useState<IConversation | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    watch,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userProfile = await getMe();
        if (!userProfile) return;
        reset({
          firstName: userProfile.firstName,
          phoneNumber: userProfile.phoneNumber,
          gender: userProfile.gender,
          dateOfBirth: userProfile.dateOfBirth.substring(0, 10),
          address: userProfile.address,
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [getMe, reset]);

  const fetchArchivedConversations = async () => {
    if (!user?._id) return;
    setLoadingArchived(true);
    try {
      const response = await chatService.getArchivedConversations(user._id, {
        page: 1,
        limit: 50,
        sort: "updatedAt,DESC",
      });
      if (response.success) {
        setArchivedConversations(response.data);
      }
    } catch (error) {
      console.error("Failed to load archived conversations", error);
      toast.error(t("Unable to load archived chats"));
    } finally {
      setLoadingArchived(false);
    }
  };

  const getConversationTitle = (conversation: IConversation): string => {
    if (conversation.title && conversation.title.trim()) return conversation.title.trim();
    const firstUserMessage = conversation.chat.find((msg) => msg.role === "user");
    if (firstUserMessage && typeof firstUserMessage.message === "string") {
      return firstUserMessage.message.length > 48
        ? `${firstUserMessage.message.substring(0, 48)}...`
        : firstUserMessage.message;
    }
    return new Date(conversation.createdAt).toLocaleDateString("vi-VN");
  };

  const handleUnarchive = async (conversationId: string) => {
    setBusyConversationId(conversationId);
    try {
      await chatService.archiveConversation(conversationId, false);
      setArchivedConversations((prev) => prev.filter((item) => item._id !== conversationId));
      toast.success(t("Conversation unarchived successfully"));
    } catch (error) {
      console.error("Failed to unarchive conversation", error);
      toast.error(t("Unable to unarchive conversation"));
    } finally {
      setBusyConversationId(null);
    }
  };

  const handleDeleteArchivedConversation = async (conversationId: string) => {
    setBusyConversationId(conversationId);
    try {
      await chatService.deleteConversation(conversationId);
      setArchivedConversations((prev) => prev.filter((item) => item._id !== conversationId));
      toast.success(t("Conversation deleted successfully"));
    } catch (error) {
      console.error("Failed to delete archived conversation", error);
      toast.error(t("Unable to delete conversation"));
    } finally {
      setBusyConversationId(null);
    }
  };

  const openUnarchiveDialog = (conversation: IConversation) => {
    setSelectedArchivedConversation(conversation);
    setUnarchiveDialogOpen(true);
  };

  const openDeleteArchivedDialog = (conversation: IConversation) => {
    setSelectedArchivedConversation(conversation);
    setDeleteArchivedDialogOpen(true);
  };

  const confirmUnarchiveConversation = async () => {
    if (!selectedArchivedConversation) return;
    await handleUnarchive(selectedArchivedConversation._id);
    setUnarchiveDialogOpen(false);
    setSelectedArchivedConversation(null);
  };

  const confirmDeleteArchivedConversation = async () => {
    if (!selectedArchivedConversation) return;
    await handleDeleteArchivedConversation(selectedArchivedConversation._id);
    setDeleteArchivedDialogOpen(false);
    setSelectedArchivedConversation(null);
  };

  const handleClearAllHistory = async () => {
    if (!user?._id) return;
    const confirmed = window.confirm(
      t("Are you sure you want to delete all chat history? This action cannot be undone.")
    );
    if (!confirmed) return;

    setClearingAll(true);
    try {
      const response = await chatService.clearAllConversations(user._id);
      toast.success(t("Deleted {{count}} conversations", { count: response.data.deletedCount }));
      setArchivedConversations([]);
    } catch (error) {
      console.error("Failed to clear all conversation history", error);
      toast.error(t("Unable to clear all chat history"));
    } finally {
      setClearingAll(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const updatedUser = await updateMe(data);
      if (!updatedUser) return;
      toast.success("Cập nhật thông tin thành công");
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (!user) return <div>Đang tải...</div>;

  const genderValue = watch("gender", user.gender);

  return (
    <div className="p-4 md:p-6 max-w-4xl w-full mx-auto min-h-screen flex flex-col gap-6">
      <div className="bg-gradient-to-r from-blue-100 to-yellow-100 rounded-xl p-4 md:p-6 transition-all duration-300 ease-in-out dark:from-blue-800 dark:to-yellow-800">
        <Button
          variant="outline"
          className="absolute top-4 left-4 text-gray-600 hover:bg-gray-200"
          onClick={() => navigate(-1)} // Quay lại trang trước đó
        >
          ← Quay lại
        </Button>
        <div className="flex items-center space-x-4 relative">
          {/* Avatar có nút sửa */}
          <div className="relative w-16 h-16">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar} className="object-cover" />
              <AvatarFallback>{user.firstName?.[0] || "?"}</AvatarFallback>
            </Avatar>

            <button
              type="button"
              className="absolute bottom-0 right-0 bg-card p-1 text-card-foreground rounded-full shadow hover:scale-105 transition-all dark:bg-gray-700 dark:text-white"
              onClick={() => setOpenAvatarDialog(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-700 dark:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7h2l2-3h10l2 3h2a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V9a2 2 0 012-2z"
                />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </button>
          </div>

          {/* Thông tin người dùng */}
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
              {user.firstName}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground dark:text-gray-300">
              {user.email}
            </p>
          </div>

          {/* Nút Edit/Cancel */}
          <Button
            className="ml-auto"
            onClick={() => {
              setIsEditing(!isEditing);
              if (isEditing) reset(user); // reset khi bấm Cancel
            }}
          >
            {isEditing ? "Hủy" : "Chỉnh sửa"}
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-card text-card-foreground rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 dark:bg-gray-800 dark:text-white"
      >
        <div>
          <label className="text-sm md:text-base font-medium">Họ và tên</label>
          {isEditing ? (
            <Input
              {...register("firstName")} // name="firstName"
              placeholder="Nhập tên của bạn"
              className="text-sm mt-1 md:text-base dark:bg-gray-700 dark:text-white"
            />
          ) : (
            <p className="mt-1">{user.firstName + " " + user.lastName}</p>
          )}
          {errors.firstName && (
            <p className="text-red-500 text-sm">{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm md:text-base font-medium">
            Ngày sinh
          </label>
          {isEditing ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-full text-left mt-1 text-sm md:text-base font-normal px-2 py-1.5 border rounded-md bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600",
                    !watch("dateOfBirth") && "text-muted-foreground"
                  )}
                >
                  {watch("dateOfBirth")
                    ? format(new Date(watch("dateOfBirth")), "dd/MM/yyyy")
                    : "Chọn ngày sinh"}
                  <CalendarIcon className="ml-auto float-right h-5 w-5 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    watch("dateOfBirth")
                      ? new Date(watch("dateOfBirth"))
                      : undefined
                  }
                  onSelect={(date) => {
                    if (date) {
                      // Chuyển đổi sang định dạng ngày mà không bị ảnh hưởng múi giờ
                      const localDate = new Date(date);
                      localDate.setMinutes(
                        localDate.getMinutes() - localDate.getTimezoneOffset()
                      ); // Điều chỉnh theo múi giờ
                      setValue(
                        "dateOfBirth",
                        localDate.toISOString().substring(0, 10)
                      ); // Lưu ngày theo định dạng yyyy-mm-dd
                    }
                  }}
                  captionLayout="dropdown"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            <p className="mt-1">
              {new Date(user.dateOfBirth).toLocaleDateString("vi-VN")}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm md:text-base font-medium">Giới tính</label>
          {isEditing ? (
            <Select
              onValueChange={(val) =>
                setValue("gender", val as "MALE" | "FEMALE")
              }
              value={genderValue}
            >
              <SelectTrigger className="w-full text-sm mt-1 md:text-base dark:bg-gray-700 dark:text-white">
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Nam</SelectItem>
                <SelectItem value="FEMALE">Nữ</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="mt-1">{user.gender === "MALE" ? "Nam" : "Nữ"}</p>
          )}
        </div>

        <div>
          <label className="text-sm md:text-base font-medium">Địa chỉ</label>
          {isEditing ? (
            <Input
              {...register("address")}
              placeholder="Nhập địa chỉ của bạn"
              className="text-sm mt-1 md:text-base dark:bg-gray-700 dark:text-white"
            />
          ) : (
            <p className="mt-1">{user.address}</p>
          )}
        </div>

        <div>
          <label className="text-sm md:text-base font-medium">Số điện thoại</label>
          {isEditing ? (
            <Input
              {...register("phoneNumber")}
              placeholder="Nhập số điện thoại"
              className="text-sm mt-1 md:text-base dark:bg-gray-700 dark:text-white"
            />
          ) : (
            <p className="mt-1">{user.phoneNumber}</p>
          )}
        </div>

        <div className="text-sm md:text-base ">
          <label className="text-sm md:text-base font-medium">Email</label>
          <div className="flex items-center gap-2">
            <p className="mt-1">{user.email}</p>
          </div>
        </div>

        {isEditing && (
          <div className="col-span-2 flex justify-end">
            <Button type="submit">Save</Button>
          </div>
        )}
      </form>

      <div className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 dark:bg-gray-800 dark:text-white">
        <p className="text-sm md:text-base font-medium">Change Password</p>
        <div className="col-span-4 flex justify-start items-center gap-4">
          <Button onClick={() => setOpenPasswordDialog(true)}>
            Change Password
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 transition-all duration-300 dark:bg-gray-800 dark:text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base md:text-lg font-semibold">Lịch sử chat đã lưu trữ</h3>
            <p className="text-sm text-muted-foreground">
              {t("Manage your conversation data in one place")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setOpenDataControlDialog(true)}>
              <Archive className="h-4 w-4 mr-2" />
              {t("Open data controls")}
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={openDataControlDialog}
        onOpenChange={(open) => {
          setOpenDataControlDialog(open);
          if (!open) {
            setShowArchived(false);
            setDataControlTab("data");
          }
        }}
      >
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-card text-card-foreground">
          <div className="grid grid-cols-[240px_1fr] min-h-[560px]">
            <aside className="border-r bg-muted/40 p-4">
              <div className="space-y-1">
                {[
                  { key: "general", label: t("General"), icon: Settings },
                  { key: "notice", label: t("Notifications"), icon: Bell },
                  { key: "personal", label: t("Personalization"), icon: SlidersHorizontal },
                  { key: "apps", label: t("Apps"), icon: AppWindow },
                  { key: "data", label: t("Data controls"), icon: Archive },
                  { key: "security", label: t("Security"), icon: Shield },
                  { key: "account", label: t("Account"), icon: UserRound },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = dataControlTab === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setDataControlTab(item.key as typeof dataControlTab)}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left",
                        active
                          ? "bg-background shadow-sm font-medium"
                          : "text-muted-foreground hover:bg-background/60"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="p-6">
              <h3 className="text-2xl font-semibold mb-4">
                {dataControlTab === "data"
                  ? t("Data controls")
                  : [
                      { key: "general", title: t("General") },
                      { key: "notice", title: t("Notifications") },
                      { key: "personal", title: t("Personalization") },
                      { key: "apps", title: t("Apps") },
                      { key: "security", title: t("Security") },
                      { key: "account", title: t("Account") },
                    ].find((item) => item.key === dataControlTab)?.title}
              </h3>

              {dataControlTab !== "data" ? (
                <div className="border rounded-lg p-6">
                  <p className="text-sm text-muted-foreground">
                    {t("This section is under development.")}
                  </p>
                </div>
              ) : (
                <div className="divide-y border rounded-lg">
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="font-medium">{t("Shared links")}</p>
                    <p className="text-sm text-muted-foreground">{t("Manage links you have shared")}</p>
                  </div>
                  <Button variant="outline" onClick={() => toast.info(t("This feature is coming soon"))}>{t("Manage")}</Button>
                </div>

                <div className="px-4 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("Archived chats")}</p>
                      <p className="text-sm text-muted-foreground">{t("View, unarchive, or delete archived conversations")}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const next = !showArchived;
                        setShowArchived(next);
                        if (next) {
                          await fetchArchivedConversations();
                        }
                      }}
                    >
                      {showArchived ? t("Hide") : t("Manage")}
                    </Button>
                  </div>

                  {showArchived && (
                    <div className="border rounded-lg divide-y max-h-[260px] overflow-auto">
                      {loadingArchived ? (
                        <div className="p-4 text-sm text-muted-foreground">{t("Loading archived chats...")}</div>
                      ) : archivedConversations.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground">{t("No archived conversations.")}</div>
                      ) : (
                        archivedConversations.map((conversation) => (
                          <div key={conversation._id} className="p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium truncate">{getConversationTitle(conversation)}</p>
                              <p className="text-xs text-muted-foreground">
                                {t("Updated")}: {new Date(conversation.updatedAt).toLocaleString("vi-VN")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openUnarchiveDialog(conversation)}
                                disabled={busyConversationId === conversation._id}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                {t("Unarchive")}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openDeleteArchivedDialog(conversation)}
                                disabled={busyConversationId === conversation._id}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {t("Delete")}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="font-medium">{t("Archive all chats")}</p>
                    <p className="text-sm text-muted-foreground">{t("Bulk archive is not available yet")}</p>
                  </div>
                  <Button variant="outline" disabled>{t("Archive all")}</Button>
                </div>

                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="font-medium">{t("Delete all chats")}</p>
                    <p className="text-sm text-muted-foreground">{t("Reset your conversation data")}</p>
                  </div>
                  <Button variant="destructive" onClick={handleClearAllHistory} disabled={clearingAll}>
                    {clearingAll ? t("Deleting...") : t("Delete all")}
                  </Button>
                </div>

                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="font-medium">{t("Export data")}</p>
                    <p className="text-sm text-muted-foreground">{t("Download your conversation data")}</p>
                  </div>
                  <Button variant="outline" onClick={() => toast.info(t("This feature is coming soon"))}>{t("Export")}</Button>
                </div>
              </div>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Change Password */}
      <Dialog open={openPasswordDialog} onOpenChange={setOpenPasswordDialog}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Old Password */}
            <div className="relative">
              <label className="text-sm font-medium mb-1 block">
                Mật khẩu hiện tại
              </label>
              <Input
                type={showOldPass ? "text" : "password"}
                placeholder="Nhập mật khẩu hiện tại"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="bg-background text-foreground"
              />
              <div
                className="absolute right-3 top-9 cursor-pointer"
                onClick={() => setShowOldPass(!showOldPass)}
              >
                {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>

            {/* New Password */}
            <div className="relative">
              <label className="text-sm font-medium mb-1 block">
                Mật khẩu mới
              </label>
              <Input
                type={showNewPass ? "text" : "password"}
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-background text-foreground"
              />
              <div
                className="absolute right-3 top-9 cursor-pointer"
                onClick={() => setShowNewPass(!showNewPass)}
              >
                {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <label className="text-sm font-medium mb-1 block">
                Nhập lại mật khẩu mới
              </label>
              <Input
                type={showConfirmPass ? "text" : "password"}
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background text-foreground"
              />
              <div
                className="absolute right-3 top-9 cursor-pointer"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
              >
                {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>

            {passwordError && (
              <p className="text-red-500 text-sm">{passwordError}</p>
            )}
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenPasswordDialog(false)}
            >
              Hủy
            </Button>
            <Button
            // onClick={async () => {
            //   setPasswordError("");
            //   if (!oldPassword || !newPassword || !confirmPassword) {
            //     setPasswordError("Vui lòng nhập đầy đủ thông tin");
            //     return;
            //   }
            //   if (newPassword !== confirmPassword) {
            //     setPasswordError("Mật khẩu mới và nhập lại không khớp");
            //     return;
            //   }

            //   try {
            //     await updatePassword({
            //       oldPassword,
            //       newPassword,
            //       newPasswordConfirm: confirmPassword,
            //     });
            //     toast.success("Đổi mật khẩu thành công!");
            //     setOpenPasswordDialog(false);
            //     setOldPassword("");
            //     setNewPassword("");
            //     setConfirmPassword("");
            //   } catch (err) {
            //     setPasswordError(
            //       "Đổi mật khẩu không thành công, thử lại sau"
            //     );
            //   }
            // }}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={unarchiveDialogOpen}
        onOpenChange={(open) => {
          setUnarchiveDialogOpen(open);
          if (!open) setSelectedArchivedConversation(null);
        }}
      >
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Bỏ lưu trữ cuộc hội thoại</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có muốn bỏ lưu trữ cuộc hội thoại này để đưa lại vào danh sách lịch sử chính không?
          </p>
          {selectedArchivedConversation && (
            <p className="text-sm font-medium truncate">{getConversationTitle(selectedArchivedConversation)}</p>
          )}
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUnarchiveDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void confirmUnarchiveConversation()}>
              Xác nhận bỏ lưu trữ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteArchivedDialogOpen}
        onOpenChange={(open) => {
          setDeleteArchivedDialogOpen(open);
          if (!open) setSelectedArchivedConversation(null);
        }}
      >
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Xóa cuộc hội thoại đã lưu trữ</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Hành động này sẽ xóa vĩnh viễn cuộc hội thoại đã lưu trữ. Bạn có chắc chắn muốn tiếp tục?
          </p>
          {selectedArchivedConversation && (
            <p className="text-sm font-medium truncate">{getConversationTitle(selectedArchivedConversation)}</p>
          )}
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteArchivedDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={() => void confirmDeleteArchivedConversation()}>
              Xóa vĩnh viễn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openAvatarDialog} onOpenChange={setOpenAvatarDialog}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Đổi ảnh đại diện</DialogTitle>
          </DialogHeader>

          {selectedFile && (
            <div className="mb-4">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Selected Avatar"
                className="w-32 h-32 object-cover rounded-full"
              />
            </div>
          )}

          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
            }}
            className="bg-background text-foreground"
          />

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenAvatarDialog(false)}
            >
              Hủy
            </Button>
            <Button
            // onClick={async () => {
            //   if (!selectedFile) return;
            //   try {
            //     const userUpdated = await updateAvatar(selectedFile);
            //     toast.success("Cập nhật avatar thành công!");
            //     if (!userUpdated) return;
            //     setUser(userUpdated);
            //     setSelectedFile(null);
            //     setOpenAvatarDialog(false);
            //   } catch (err) {
            //     console.error("Lỗi khi cập nhật avatar:", err);
            //   }
            // }}
            >
              Lưu ảnh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
