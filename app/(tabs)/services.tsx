// app/(tabs)/services.tsx

import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useMemo, useState } from "react";
import SafeScreen from "@/components/SafeScreen";
import useServices from "@/hooks/useServices";

const CATEGORIES = [
  { name: "All", icon: "briefcase-outline" as const },
  { name: "Machinery", icon: "construct-outline" as const },
  { name: "Plowing", icon: "leaf-outline" as const },
  { name: "Harvesting", icon: "cut-outline" as const },
  { name: "Irrigation", icon: "water-outline" as const },
  { name: "Labor", icon: "people-outline" as const },
  { name: "Veterinary", icon: "medkit-outline" as const },     // Better than "Animal Doctor"
  { name: "Trimming", icon: "cut-outline" as const },
];

const ServicesScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const {
    data: services = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useServices();

  // Filtered services based on search + category
  const filteredServices = useMemo(() => {
    if (!services) return [];

    let filtered = services;

    // Category filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter((service) => service.category === selectedCategory);
    }

    // Search filter (by name, description, or location)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(query) ||
          service.service.toLowerCase().includes(query) ||
          service.location.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [services, selectedCategory, searchQuery]);

  const handleCall = (phone: string) => {
    const cleaned = phone.replace(/[^+\d]/g, "");
    Linking.openURL(`tel:${cleaned}`).catch(() =>
      Alert.alert("Error", "Cannot open dialer")
    );
  };

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View className="px-6 pb-4 pt-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-text-primary text-3xl font-bold tracking-tight">
                Services
              </Text>
              <Text className="text-text-secondary text-sm mt-1">
                Local farmer services near you
              </Text>
            </View>

            <TouchableOpacity className="bg-surface/50 p-3 rounded-full" activeOpacity={0.7}>
              <Ionicons name="options-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View className="bg-surface flex-row items-center px-5 py-4 rounded-2xl">
            <Ionicons name="search" size={22} color="#666" />
            <TextInput
              placeholder="Search services, location..."
              placeholderTextColor="#666"
              className="flex-1 ml-3 text-base text-text-primary"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* CATEGORY FILTER */}
        <View className="mb-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.name;
              return (
                <TouchableOpacity
                  key={category.name}
                  onPress={() => setSelectedCategory(category.name)}
                  className={`mr-3 rounded-2xl size-20 items-center justify-center overflow-hidden ${
                    isSelected ? "bg-primary" : "bg-surface"
                  }`}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={category.icon}
                    size={36}
                    color={isSelected ? "#121212" : "#fff"}
                  />
                  <Text
                    className={`text-xs mt-1 font-medium ${
                      isSelected ? "text-black" : "text-white"
                    }`}
                    numberOfLines={1}
                  >
                    {category.name === "All" ? "All" : category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* RESULTS COUNT */}
        <View className="px-6 mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-text-primary text-lg font-bold">Services</Text>
            <Text className="text-text-secondary text-sm">
              {filteredServices.length} {filteredServices.length === 1 ? "service" : "services"}
            </Text>
          </View>
        </View>

        {/* LOADING */}
        {isLoading && (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#1DB954" />
            <Text className="text-text-secondary mt-4">Loading services...</Text>
          </View>
        )}

        {/* ERROR */}
        {isError && (
          <View className="py-20 items-center px-6">
            <Ionicons name="alert-circle-outline" size={60} color="#FF4444" />
            <Text className="text-text-primary font-bold text-lg mt-6 text-center">
              Failed to load services
            </Text>
            <Text className="text-text-secondary text-center mt-2 max-w-xs">
              {error instanceof Error ? error.message : "Please try again"}
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              className="mt-6 bg-primary px-8 py-4 rounded-full"
            >
              <Text className="text-black font-bold">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* EMPTY STATE */}
        {!isLoading && !isError && filteredServices.length === 0 && (
          <View className="py-20 items-center px-6">
            <Ionicons name="briefcase-outline" size={60} color="#888" />
            <Text className="text-text-primary font-bold text-lg mt-6 text-center">
              No services found
            </Text>
            <Text className="text-text-secondary text-center mt-2">
              Try adjusting your search or category
            </Text>
          </View>
        )}

        {/* SERVICES LIST */}
        <View className="px-6 pb-6">
          {filteredServices.map((service) => (
            <TouchableOpacity
              key={service._id}
              activeOpacity={0.9}
              className="bg-surface rounded-3xl overflow-hidden mb-6 shadow-lg"
              style={{ elevation: 6 }}
            >
              <View className="flex-row">
                {/* Image */}
                <Image
                  source={{ uri: service.image }}
                  className="w-36 h-36 rounded-l-3xl"
                  resizeMode="cover"
                />

                {/* Details */}
                <View className="flex-1 p-5 justify-between">
                  <View>
                    {/* Category Badge */}
                    <View className="mb-2">
                      <Text className="text-primary font-semibold text-xs uppercase tracking-wider">
                        {service.category}
                      </Text>
                    </View>

                    <Text className="text-text-primary font-bold text-xl">
                      {service.name}
                    </Text>
                    <Text className="text-text-secondary text-sm mt-2 line-clamp-3">
                      {service.service}
                    </Text>

                    <View className="flex-row items-center mt-4">
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text className="text-text-secondary text-sm ml-2">
                        {service.location}
                      </Text>
                    </View>
                  </View>

                  {/* Price + Call */}
                  <View className="flex-row items-center justify-between mt-5">
                    <Text className="text-primary font-bold text-2xl">
                      TND{service.price}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleCall(service.tell)}
                      className="bg-primary rounded-full w-14 h-14 items-center justify-center shadow-md"
                    >
                      <Ionicons name="call" size={26} color="#121212" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeScreen>
  );
};

export default ServicesScreen;