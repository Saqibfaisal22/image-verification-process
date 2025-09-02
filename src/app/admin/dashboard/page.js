"use client"

import { useEffect, useState, useCallback } from "react"
import { auth, db } from "../../../firebase/config"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore"
import { useRouter } from "next/navigation"
import GenerateLinkModal from "../../../components/GenerateLinkModal"

function CreateUserForm({ currentUser }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [tier, setTier] = useState("free")
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const idToken = await currentUser.getIdToken()
      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email, password, tier }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user")
      }

      setSuccess(`User ${email} created successfully!`)
      setEmail("")
      setPassword("")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New User</h2>
      <form onSubmit={handleCreateUser} className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
        <div>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
          >
            <option value="free">Free Tier</option>
            <option value="basic">Basic Tier</option>
            <option value="premium">Premium Tier</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Create User
        </button>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>
        )}
      </form>
    </div>
  )
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [links, setLinks] = useState([])
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("links")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleTabClick = (tab) => {
    setActiveTab(tab)
  }

  const fetchLinksAndImages = useCallback(async (currentUser) => {
    const linksCollection = collection(db, "links")
    let linksQuery = linksCollection

    if (currentUser.email !== "admin@gmail.com") {
      linksQuery = query(linksCollection, where("userId", "==", currentUser.uid))
    }

    const linksSnapshot = await getDocs(linksQuery)
    const linksList = linksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    setLinks(linksList)

    const imagesList = linksList
      .filter((link) => link.status === "used" && link.images)
      .flatMap((link) => link.images.map((image) => ({ url: image, linkId: link.id })))
    setImages(imagesList)
  }, [])

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
      } else {
        router.push("/admin")
      }
      setLoading(false)
    })
    return () => unsubscribeAuth()
  }, [router])

  useEffect(() => {
    if (!user) return

    fetchLinksAndImages(user)

    const userRef = collection(db, "users")
    const unsubscribeUsers = onSnapshot(userRef, (snapshot) => {
      const usersList = snapshot.docs.map((doc) => doc.data())
      setAllUsers(usersList)
      const currentUserData = usersList.find((u) => u.userId === user.uid)
      if (currentUserData) {
        setUserData(currentUserData)
      }
    })

    return () => unsubscribeUsers()
  }, [user, fetchLinksAndImages])

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const generateLink = async (formData) => {
    setError(null)
    if (!user) {
      setError("You must be logged in to generate a link.")
      return
    }

    try {
      const idToken = await user.getIdToken()
      const response = await fetch("/api/generate-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || "Failed to generate link")
      }

      fetchLinksAndImages(user)
      handleCloseModal()
    } catch (error) {
      setError(error.message)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/admin")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  const isAdmin = user && user.email === "admin@gmail.com"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              {user && (
                <p className="text-gray-600">
                  Welcome back, <span className="font-medium text-gray-900">{user.email}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
              <button
                onClick={handleOpenModal}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 px-5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Generate Link
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-5 rounded-lg transition-colors border border-gray-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* User Stats Card */}
        {userData && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Account</h3>
                <p className="text-gray-600">
                  <span className="font-medium text-blue-700">
                    {userData.tier.charAt(0).toUpperCase() + userData.tier.slice(1)} Tier
                  </span>
                  {" • "}
                  <span className="font-medium">{userData.linksThisMonth}</span> of{" "}
                  <span className="font-medium">
                    {userData.tier === "free" ? 10 : userData.tier === "basic" ? 15 : 20}
                  </span>{" "}
                  links used this month
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{userData.linksThisMonth}</div>
                <div className="text-sm text-gray-500">Links Used</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

        <GenerateLinkModal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={generateLink} />

        {/* Admin Create User Form */}
        {isAdmin && <CreateUserForm currentUser={user} />}

        {/* Admin Users Table */}
        {isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allUsers.map((u) => (
                    <tr key={u.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            u.tier === "premium"
                              ? "bg-purple-100 text-purple-800"
                              : u.tier === "basic"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {u.tier.charAt(0).toUpperCase() + u.tier.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.linksThisMonth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabs and Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => handleTabClick("links")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "links"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {isAdmin ? "All Generated Links" : "My Generated Links"}
              </button>
              <button
                onClick={() => handleTabClick("images")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "images"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {isAdmin ? "All Uploaded Images" : "My Uploaded Images"}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "links" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Link ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Link
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {links.map((link) => (
                      <tr key={link.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{link.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              link.status === "used"
                                ? "bg-green-100 text-green-800"
                                : link.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {link.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <a
                            href={`/upload/${link.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          >
                            /upload/{link.id}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "images" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-white">
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt={`Uploaded image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Link ID:</span> <span className="font-mono">{image.linkId}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
