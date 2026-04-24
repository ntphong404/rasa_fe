//===profile== page
//=====
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
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
  Image as ImageIcon,
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
  const { t, i18n } = useTranslation();
  //   const {
  //     getProfile,
  //     updateProfile,
  //     updateAvatar,
  //     updatePassword,
  //   } = useUser();

  //   const user = useUserStore((state) => state.user);
  //   const setUser = useUserStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  const { getMe, updateMe, updateAvatar, updatePassword } = useMe();

  const [isEditing, setIsEditing] = useState(false);

  // Dialog để đổi avatar
  const [openAvatarDialog, setOpenAvatarDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  // Helper để cắt ảnh
  const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<File> => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const file = new File([blob], fileName, { type: "image/jpeg" });
        resolve(file);
      }, "image/jpeg");
    });
  };

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
          lastName: userProfile.lastName,
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
      toast.success(t("Profile updated successfully"));
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (!user) return <div>{t("Loading...")}</div>;

  const genderValue = watch("gender", user.gender);

  return (
    <div className="p-4 md:p-6 max-w-4xl w-full mx-auto min-h-screen flex flex-col gap-6">
      <div className="bg-gradient-to-r from-blue-100 to-yellow-100 rounded-xl p-4 md:p-6 transition-all duration-300 ease-in-out dark:from-blue-800 dark:to-yellow-800">
        <Button
          variant="outline"
          className="absolute top-4 left-4 text-gray-600 hover:bg-gray-200"
          onClick={() => navigate(-1)} // Quay lại trang trước đó
        >
          ← {t("Back")}
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
              {i18n.language === 'en' ? `${user.firstName} ${user.lastName}` : `${user.lastName} ${user.firstName}`}
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
            {isEditing ? t("Cancel") : t("Edit")}
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-card text-card-foreground rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 dark:bg-gray-800 dark:text-white"
      >
        {isEditing ? (
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm md:text-base font-medium">{t("Last Name")}</label>
              <Input
                {...register("lastName")}
                placeholder={t("Last Name")}
                className="text-sm mt-1 md:text-base dark:bg-gray-700 dark:text-white"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>
            <div className="flex-1">
              <label className="text-sm md:text-base font-medium">{t("First Name")}</label>
              <Input
                {...register("firstName")}
                placeholder={t("First Name")}
                className="text-sm mt-1 md:text-base dark:bg-gray-700 dark:text-white"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="text-sm md:text-base font-medium">{t("Full Name")}</label>
            <p className="mt-1">{user.lastName} {user.firstName}</p>
          </div>
        )}

        <div>
          <label className="text-sm md:text-base font-medium">
            {t("Date of Birth")}
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
                    : t("Date of Birth")}
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
                  defaultMonth={
                    watch("dateOfBirth")
                      ? new Date(watch("dateOfBirth"))
                      : new Date()
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
          <label className="text-sm md:text-base font-medium">{t("Gender")}</label>
          {isEditing ? (
            <Select
              onValueChange={(val) =>
                setValue("gender", val as "MALE" | "FEMALE")
              }
              value={genderValue}
            >
              <SelectTrigger className="w-full text-sm mt-1 md:text-base dark:bg-gray-700 dark:text-white">
                <SelectValue placeholder={t("Select Gender")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">{t("Male")}</SelectItem>
                <SelectItem value="FEMALE">{t("Female")}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="mt-1">{user.gender === "MALE" ? t("Male") : t("Female")}</p>
          )}
        </div>

        <div>
          <label className="text-sm md:text-base font-medium">{t("Address")}</label>
          {isEditing ? (
            <Input
              {...register("address")}
              placeholder={t("Enter your address")}
              className="text-sm mt-1 md:text-base dark:bg-gray-700 dark:text-white"
            />
          ) : (
            <p className="mt-1">{user.address}</p>
          )}
        </div>

        <div>
          <label className="text-sm md:text-base font-medium">{t("Phone Number")}</label>
          {isEditing ? (
            <Input
              {...register("phoneNumber")}
              placeholder={t("Enter phone number")}
              className="text-sm mt-1 md:text-base dark:bg-gray-700 dark:text-white"
            />
          ) : (
            <p className="mt-1">{user.phoneNumber}</p>
          )}
        </div>

        <div className="text-sm md:text-base ">
          <label className="text-sm md:text-base font-medium">{t("Email")}</label>
          <div className="flex items-center gap-2">
            <p className="mt-1">{user.email}</p>
          </div>
        </div>

        {isEditing && (
          <div className="col-span-2 flex justify-end">
            <Button type="submit">{t("Save")}</Button>
          </div>
        )}
      </form>

      <div className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 dark:bg-gray-800 dark:text-white">
        <p className="text-sm md:text-base font-medium">{t("Change Password")}</p>
        <div className="col-span-4 flex justify-start items-center gap-4">
          <Button onClick={() => setOpenPasswordDialog(true)}>
            {t("Change Password")}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 transition-all duration-300 dark:bg-gray-800 dark:text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base md:text-lg font-semibold">{t("Archived chats")}</h3>
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

      {/* Dialog Change Avatar */}
      <Dialog open={openAvatarDialog} onOpenChange={(open) => {
        setOpenAvatarDialog(open);
        if (!open) {
          setSelectedFile(null);
          setImgSrc("");
          setCrop(undefined);
          setCompletedCrop(undefined);
        }
      }}>
        <DialogContent className="max-w-xl flex flex-col p-0 overflow-hidden bg-card text-card-foreground">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 dark:border-white/10">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <ImageIcon className="h-6 w-6 text-blue-600" />
              {t("Change Avatar")}
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {t("Upload and crop an image to use as your new avatar.")}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="flex flex-col gap-6 items-center">
              {!imgSrc ? (
                <div className="w-full flex flex-col items-center gap-4">
                  <Avatar className="w-40 h-40 border-4 border-muted shadow-lg">
                    <AvatarImage src={user.avatar} className="object-cover" />
                    <AvatarFallback className="text-4xl">{user.firstName?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm">
                    {t("Choose image from device")}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setCrop(undefined);
                          const reader = new FileReader();
                          reader.addEventListener("load", () =>
                            setImgSrc(reader.result?.toString() || "")
                          );
                          reader.readAsDataURL(e.target.files[0]);
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="border rounded-xl p-2 bg-muted/20 w-full max-h-[50vh] overflow-hidden flex justify-center">
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={1}
                      circularCrop
                    >
                      <img
                        ref={imgRef}
                        src={imgSrc}
                        alt="Crop me"
                        className="max-h-[50vh] object-contain"
                        onLoad={(e) => {
                          const { width, height } = e.currentTarget;
                          const minDim = Math.min(width, height);
                          setCrop({
                            unit: 'px',
                            width: minDim,
                            height: minDim,
                            x: (width - minDim) / 2,
                            y: (height - minDim) / 2
                          });
                        }}
                      />
                    </ReactCrop>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImgSrc("");
                      setSelectedFile(null);
                      setCrop(undefined);
                      setCompletedCrop(undefined);
                    }}
                  >
                    {t("Choose another image")}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-muted/10 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpenAvatarDialog(false);
                setSelectedFile(null);
                setImgSrc("");
              }}
            >
              {t("Cancel")}
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={async () => {
                if (!imgSrc || !imgRef.current) {
                  // No image uploaded
                  return;
                }
                try {
                  let fileToUpload = selectedFile;
                  if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
                    fileToUpload = await getCroppedImg(imgRef.current, completedCrop, "avatar.jpg");
                  }
                  
                  if (!fileToUpload) return;

                  await updateAvatar(fileToUpload);
                  setOpenAvatarDialog(false);
                  setSelectedFile(null);
                  setImgSrc("");
                } catch (error) {
                  console.error("Failed to update avatar", error);
                }
              }}
              disabled={!imgSrc}
            >
              {t("Save Avatar")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Change Password */}
      <Dialog open={openPasswordDialog} onOpenChange={setOpenPasswordDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 bg-card text-card-foreground">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 dark:border-white/10">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Shield className="h-6 w-6 text-cyan-600" />
              {t("Change Password")}
            </DialogTitle>
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {t("Update a new password to protect your account.")}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="border rounded-xl p-4 bg-muted/20 space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
                <Shield className="h-4 w-4 text-cyan-600" />
                {t("Security Information")}
              </h3>
              <div className="flex flex-col gap-4">
            {/* Old Password */}
            <div className="relative">
              <label className="text-sm font-medium mb-1 block">
                {t("Current Password")}
              </label>
              <Input
                type={showOldPass ? "text" : "password"}
                placeholder={t("Enter current password")}
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
                {t("New Password")}
              </label>
              <Input
                type={showNewPass ? "text" : "password"}
                placeholder={t("Enter new password")}
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
                {t("Confirm new password")}
              </label>
              <Input
                type={showConfirmPass ? "text" : "password"}
                placeholder={t("Confirm new password")}
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
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-muted/10 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenPasswordDialog(false)}
            >
              {t("Cancel")}
            </Button>
            <Button
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={async () => {
                // setPasswordError("");
                if (!oldPassword || !newPassword || !confirmPassword) {
                  toast.error(t("Please enter all information"));
                  return;
                }
                if (newPassword !== confirmPassword) {
                  toast.error(t("New password and confirm password do not match"));
                  return;
                }

                try {
                  await updatePassword({
                    oldPassword,
                    newPassword,
                  });
                  setOpenPasswordDialog(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                } catch (err: any) {
                  toast.error(err.response?.data?.message || t("Password change failed, please try again"));
                }
              }}
            >
              {t("Save")}
            </Button>
          </div>
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
    </div>
  );
};
