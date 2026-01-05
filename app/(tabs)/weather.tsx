import { View, Text, ActivityIndicator, StyleSheet, ScrollView, ImageBackground } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useState, useEffect } from "react"
import * as Location from "expo-location"
import { Image } from "react-native"

type CurrentWeather = {
  temp: number
  feels_like: number
  humidity: number
  pressure: number
  wind_speed: number
  description: string
  city: string
  country: string
  icon: string
  temp_min?: number
  temp_max?: number
}

type ForecastItem = {
  dt: number
  temp: number
  icon: string
  description: string
}

const farmerEvents: Record<number, Record<number, string>> = {
  1: { 13: "خروج الليالي البيض", 14: "دخول الليالي السود" },
  2: {
    2: "انتهاء الليالي السود",
    3: "العزارة",
    13: "انتهاء العزارة",
    14: "قرة العنز",
    20: "نزول جمرة الهواء",
    27: "نزول جمرة الماء",
    28: "دخول الربيع",
  },
  3: {
    6: "نزول جمرة التراب",
    10: "دخول الحسوم",
    17: "انتهاء الحسوم",
    20: "الاعتدال الربيعي",
  },
  5: { 30: "دخول الصيف" },
  6: { 21: "الانقلاب الصيفي" },
  7: { 25: "أول أوسو" },
  8: { 30: "بداية الخريف" },
  9: { 2: "انتهاء أوسو", 12: "الاعتدال الخريفي" },
  11: { 29: "دخول الشتاء" },
  12: { 25: "دخول الليالي البيض" },
}

const beautifulEventMap: Record<string, string> = {
  "دخول الليالي البيض": "الليالي البيض",
  "خروج الليالي البيض": "الليالي البيض",
  "دخول الليالي السود": "الليالي السود",
  "انتهاء الليالي السود": "الليالي السود",
  العزارة: "العزارة",
  "انتهاء العزارة": "العزارة",
  "قرة العنز": "قرة العنز",
  "نزول جمرة الهواء": "جمرة الهواء",
  "نزول جمرة الماء": "جمرة الماء",
  "نزول جمرة التراب": "جمرة التراب",
  "دخول الربيع": "الربيع",
  "دخول الحسوم": "الحسوم",
  "انتهاء الحسوم": "الحسوم",
  "الاعتدال الربيعي": "الاعتدال الربيعي",
  "دخول الصيف": "الصيف",
  "الانقلاب الصيفي": "الانقلاب الصيفي",
  "أول أوسو": "أوسو",
  "انتهاء أوسو": "أوسو",
  "بداية الخريف": "الخريف",
  "الاعتدال الخريفي": "الاعتدال الخريفي",
  "دخول الشتاء": "الشتاء",
}


// Authentic Tunisian farmer plowing with oxen - perfect traditional background
const BACKGROUND_IMAGE = require("@/assets/images/agriculture.jpg")

const WeatherScreen = () => {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null)
  const [forecast, setForecast] = useState<ForecastItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [farmerEvent, setFarmerEvent] = useState("No upcoming event")
  const [todayDate, setTodayDate] = useState("")

  useEffect(() => {
    const today = new Date()
    const day = today.getDate()
    const month = today.getMonth() + 1

    let rawEvent = "No upcoming event"

    const monthEvents = farmerEvents[month]
    if (monthEvents) {
      const upcomingDays = Object.keys(monthEvents)
        .map(Number)
        .sort((a, b) => a - b)
        .filter((d) => d >= day)

      if (upcomingDays.length > 0) {
        const upcomingDay = upcomingDays[0]
        rawEvent = monthEvents[upcomingDay]
      }
    }

    if (rawEvent === "No upcoming event") {
      const nextMonth = month === 12 ? 1 : month + 1
      const nextEvents = farmerEvents[nextMonth]
      if (nextEvents) {
        const firstDay = Math.min(...Object.keys(nextEvents).map(Number))
        rawEvent = nextEvents[firstDay]
      }
    }

    const beautifulEvent = beautifulEventMap[rawEvent] || rawEvent
    setFarmerEvent(beautifulEvent)

    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
    setTodayDate(today.toLocaleDateString("en-GB", options))

    const fetchWeather = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()

        if (status !== "granted") {
          setError("Location permission denied. Using default city.")
          await fetchWeatherByCity("Tunis")
          return
        }

        const enabled = await Location.hasServicesEnabledAsync()
        if (!enabled) {
          setError("Location services disabled. Using default city.")
          await fetchWeatherByCity("Tunis")
          return
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        })

        const { latitude, longitude } = location.coords
        await fetchWeatherByCoords(latitude, longitude)
      } catch (err) {
        console.error("Location error:", err)
        setError("Unable to get location. Using default city.")
        await fetchWeatherByCity("Tunis")
      } finally {
        setLoading(false)
      }
    }

    const fetchWeatherByCoords = async (lat: number, lon: number) => {
      const apiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY
      if (!apiKey) {
        setError("Weather API key missing")
        return
      }

      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=en`
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=en`

      await fetchAllWeather(currentUrl, forecastUrl)
    }

    const fetchWeatherByCity = async (city: string) => {
      const apiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY
      if (!apiKey) {
        setError("Weather API key missing")
        return
      }

      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=en`
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=en`

      await fetchAllWeather(currentUrl, forecastUrl)
    }

    const fetchAllWeather = async (currentUrl: string, forecastUrl: string) => {
      try {
        const [currentRes, forecastRes] = await Promise.all([fetch(currentUrl), fetch(forecastUrl)])

        const currentData = await currentRes.json()
        const forecastData = await forecastRes.json()

        if (!currentRes.ok || !forecastRes.ok) {
          setError(currentData.message || forecastData.message || "Failed to fetch weather data")
          return
        }

        setCurrentWeather({
          temp: Math.round(currentData.main.temp),
          feels_like: Math.round(currentData.main.feels_like),
          humidity: currentData.main.humidity,
          pressure: currentData.main.pressure,
          wind_speed: currentData.wind.speed,
          description: currentData.weather[0].description,
          city: currentData.name,
          country: currentData.sys.country,
          icon: currentData.weather[0].icon,
          temp_min: Math.round(currentData.main.temp_min),
          temp_max: Math.round(currentData.main.temp_max),
        })

        const forecastList: ForecastItem[] = forecastData.list.map((item: any) => ({
          dt: item.dt,
          temp: Math.round(item.main.temp),
          icon: item.weather[0].icon,
          description: item.weather[0].description,
        }))

        setForecast(forecastList)
        setError(null)
      } catch (err) {
        console.error("Weather fetch error:", err)
        setError("Failed to load weather data")
      }
    }

    fetchWeather()
  }, [])

  const getTodayHourly = () => {
    const now = Date.now() / 1000
    return forecast.filter((item) => item.dt >= now && item.dt < now + 86400).slice(0, 8)
  }

  if (loading) {
    return (
      <ImageBackground source={ BACKGROUND_IMAGE } style={styles.loadingContainer} blurRadius={6}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#A0D8B3" />
          <Text style={styles.loadingText}>Loading weather and farmer calendar...</Text>
        </View>
      </ImageBackground>
    )
  }

  if (error) {
    return (
      <ImageBackground source={BACKGROUND_IMAGE } style={styles.loadingContainer} blurRadius={6}>
        <View style={styles.loadingOverlay}>
          <Ionicons name="cloud-offline" size={80} color="#FFF" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </ImageBackground>
    )
  }

  const currentIconUrl = currentWeather?.icon ? `https://openweathermap.org/img/wn/${currentWeather.icon}@4x.png` : null
  const todayHourly = getTodayHourly()

  return (
    <ImageBackground source={ BACKGROUND_IMAGE} style={styles.container} resizeMode="cover">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-sharp" size={26} color="#FFF" />
            <Text style={styles.cityText}>{currentWeather?.city}, {currentWeather?.country}</Text>
          </View>
          <Ionicons name="notifications-outline" size={30} color="#FFF" />
        </View>

        {/* Date and Farmer Event */}
        <Text style={styles.dateText}>{todayDate}</Text>
        <View style={styles.eventCard}>
          <Text style={styles.eventText}>{farmerEvent}</Text>
        </View>

        {/* Main Weather */}
        <View style={styles.mainWeatherContainer}>
          {currentIconUrl && <Image source={{ uri: currentIconUrl }} style={styles.mainIcon} />}
          <Text style={styles.mainTemp}>{currentWeather?.temp}°</Text>
          <Text style={styles.descriptionText}>{currentWeather?.description}</Text>
          <Text style={styles.minMaxText}>
            High: {currentWeather?.temp_max}° • Low: {currentWeather?.temp_min}°
          </Text>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={28} color="#A0D8B3" />
              <Text style={styles.detailLabel}>Humidity</Text>
              <Text style={styles.detailValue}>{currentWeather?.humidity}%</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="speedometer-outline" size={28} color="#A0D8B3" />
              <Text style={styles.detailLabel}>Pressure</Text>
              <Text style={styles.detailValue}>{currentWeather?.pressure} hPa</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="flag-outline" size={28} color="#A0D8B3" />
              <Text style={styles.detailLabel}>Wind</Text>
              <Text style={styles.detailValue}>{currentWeather?.wind_speed} km/h</Text>
            </View>
          </View>
        </View>

        {/* Hourly Forecast */}
        {todayHourly.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Hourly Forecast</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyContainer}>
              {todayHourly.map((item) => {
                const hour = new Date(item.dt * 1000).getHours()
                const iconUrl = `https://openweathermap.org/img/wn/${item.icon}@2x.png`
                return (
                  <View key={item.dt} style={styles.hourlyItem}>
                    <Text style={styles.hourlyTime}>{hour}:00</Text>
                    <Image source={{ uri: iconUrl }} style={styles.hourlyIcon} />
                    <Text style={styles.hourlyTemp}>{item.temp}°</Text>
                  </View>
                )
              })}
            </ScrollView>
          </View>
        )}

        {/* Daily Forecast */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>5-Day Forecast</Text>
          <View style={styles.dailyContainer}>
            {(() => {
              const dailyForecasts: { item: ForecastItem; dayName: string }[] = []
              const seenDays = new Set<string>()

              for (const item of forecast) {
                const date = new Date(item.dt * 1000)
                const dayKey = date.toISOString().split("T")[0]
                if (!seenDays.has(dayKey) && dailyForecasts.length < 6) {
                  seenDays.add(dayKey)
                  const dayName = date.toLocaleDateString("en-GB", { weekday: "long" })
                  dailyForecasts.push({ item, dayName })
                }
              }

              return dailyForecasts.slice(1).map(({ item, dayName }) => {
                const iconUrl = `https://openweathermap.org/img/wn/${item.icon}@2x.png`
                return (
                  <View key={item.dt} style={styles.dailyItem}>
                    <Text style={styles.dailyDay}>{dayName}</Text>
                    <Image source={{ uri: iconUrl }} style={styles.dailyIcon} />
                    <Text style={styles.dailyTemp}>{item.temp}°</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </View>
                )
              })
            })()}
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  locationContainer: { flexDirection: "row", alignItems: "center" },
  cityText: { fontSize: 22, color: "#FFF", fontWeight: "bold", marginLeft: 8, textShadowColor: "rgba(0,0,0,0.7)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  dateText: { fontSize: 18, color: "#A0D8B3", textAlign: "center", marginBottom: 10, fontWeight: "600", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  eventCard: { backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 20, alignItems: "center", marginBottom: 30 },
  eventTitle: { fontSize: 18, color: "#A0D8B3", marginBottom: 8 },
  eventText: { fontSize: 28, color: "#FFF", fontWeight: "bold" },
  mainWeatherContainer: { alignItems: "center", marginBottom: 30 },
  mainIcon: { width: 180, height: 180 },
  mainTemp: { fontSize: 90, fontWeight: "300", color: "#FFF", marginTop: -20, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 6 },
  descriptionText: { fontSize: 22, color: "#FFF", opacity: 0.95, marginTop: 10, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  minMaxText: { fontSize: 18, color: "#A0D8B3", marginTop: 10, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  detailsCard: { backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 24, padding: 20, marginBottom: 30 },
  detailRow: { flexDirection: "row", justifyContent: "space-around" },
  detailItem: { alignItems: "center" },
  detailLabel: { fontSize: 14, color: "#A0D8B3", marginTop: 8 },
  detailValue: { fontSize: 20, color: "#FFF", fontWeight: "600", marginTop: 4 },
  sectionCard: { backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 24, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 20, color: "#FFF", fontWeight: "bold", marginBottom: 20 },
  hourlyContainer: { paddingHorizontal: 10 },
  hourlyItem: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 20, padding: 15, marginHorizontal: 8, width: 90 },
  hourlyTime: { color: "#A0D8B3", fontSize: 14 },
  hourlyIcon: { width: 50, height: 50, marginVertical: 10 },
  hourlyTemp: { color: "#FFF", fontSize: 18, fontWeight: "600" },
  dailyContainer: { gap: 16 },
  dailyItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.35)", borderRadius: 16, padding: 16 },
  dailyDay: { fontSize: 18, color: "#FFF", fontWeight: "600", flex: 2 },
  dailyIcon: { width: 50, height: 50, flex: 1 },
  dailyTemp: { fontSize: 18, color: "#FFF", fontWeight: "600", flex: 1, textAlign: "right" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingOverlay: { backgroundColor: "rgba(0,0,0,0.5)", padding: 40, borderRadius: 20, alignItems: "center" },
  loadingText: { color: "#A0D8B3", marginTop: 20, fontSize: 18 },
  errorText: { color: "#FF6B6B", fontSize: 18, textAlign: "center", marginTop: 20, paddingHorizontal: 40 },
})

export default WeatherScreen