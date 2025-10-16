// import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
// import { SlotService } from "@/api/service/slot.service";
// import { ICreateSlotDto, ISlotQuery, IUpdateSlotDto } from "@/lib/types/slot.interface";
// import { toast } from "sonner";

// export const useSlots = (query?: ISlotQuery) => {
//   const { data, isLoading, error } = useQuery({
//     queryKey: ["slots", query],
//     queryFn: () => SlotService.getAll(query),
//     keepPreviousData: true,
//   });

//   return {
//     slots: data?.data || [],
//     total: data?.total || 0,
//     isLoading,
//     error,
//   };
// };

// export const useSlot = (id: string) => {
//   const { data, isLoading, error } = useQuery({
//     queryKey: ["slot", id],
//     queryFn: () => SlotService.getById(id),
//     enabled: !!id,
//   });

//   return {
//     slot: data,
//     isLoading,
//     error,
//   };
// };

// export const useCreateSlot = () => {
//   const queryClient = useQueryClient();

//   const { mutate, isLoading } = useMutation({
//     mutationFn: (data: ICreateSlotDto) => SlotService.create(data),
//     onSuccess: () => {
//       queryClient.invalidateQueries(["slots"]);
//       toast.success("Slot created successfully");
//     },
//     onError: (error: any) => {
//       toast.error(error?.response?.data?.message || "Something went wrong!");
//     },
//   });

//   return {
//     createSlot: mutate,
//     isLoading,
//   };
// };

// export const useUpdateSlot = () => {
//   const queryClient = useQueryClient();

//   const { mutate, isLoading } = useMutation({
//     mutationFn: (data: IUpdateSlotDto) => SlotService.update(data),
//     onSuccess: () => {
//       queryClient.invalidateQueries(["slots"]);
//       toast.success("Slot updated successfully");
//     },
//     onError: (error: any) => {
//       toast.error(error?.response?.data?.message || "Something went wrong!");
//     },
//   });

//   return {
//     updateSlot: mutate,
//     isLoading,
//   };
// };

// export const useDeleteSlot = () => {
//   const queryClient = useQueryClient();

//   const { mutate: hardDelete, isLoading: isHardDeleting } = useMutation({
//     mutationFn: (id: string) => SlotService.hardDelete(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries(["slots"]);
//       toast.success("Slot deleted successfully");
//     },
//     onError: (error: any) => {
//       toast.error(error?.response?.data?.message || "Something went wrong!");
//     },
//   });

//   const { mutate: softDelete, isLoading: isSoftDeleting } = useMutation({
//     mutationFn: (id: string) => SlotService.softDelete(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries(["slots"]);
//       toast.success("Slot deleted successfully");
//     },
//     onError: (error: any) => {
//       toast.error(error?.response?.data?.message || "Something went wrong!");
//     },
//   });

//   return {
//     hardDelete,
//     softDelete,
//     isDeleting: isHardDeleting || isSoftDeleting,
//   };
// };

// export const useRestoreSlot = () => {
//   const queryClient = useQueryClient();

//   const { mutate, isLoading } = useMutation({
//     mutationFn: (id: string) => SlotService.restore(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries(["slots"]);
//       toast.success("Slot restored successfully");
//     },
//     onError: (error: any) => {
//       toast.error(error?.response?.data?.message || "Something went wrong!");
//     },
//   });

//   return {
//     restore: mutate,
//     isLoading,
//   };
// };