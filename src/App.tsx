import React, { useState } from 'react'
import {
  ShoppingCart, Shield, Star, ChevronRight,
  Check, Award, Lock,
  Zap, Package, AlertCircle,
  Sparkles, Trophy, BadgeCheck, Disc,
  Monitor, Cpu, HardDrive, Laptop, Server,
  MousePointer, Mic, PenTool, Layers, Image
} from 'lucide-react'
import ImageGallery from './components/ImageGallery'

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'pro' | 'm365'>('home')
  const [expandedFeatures, setExpandedFeatures] = useState(false)

  const productVariants = {
    home: {
      name: "Microsoft Windows 11 Home OEM",
      fullName: "Microsoft System Builder | Windows 11 Home | OEM License",
      price: "$119.99",
      originalPrice: "$139.99",
      discount: "15% OFF",
      savings: "$20",
      format: "DVD FORMAT - Physical Media Included",
      mainImage: "/js/Win11Store/images/win11-home-1.jpg",
      affiliateUrl: "https://www.amazon.com/dp/B09MYJ1R6L?tag=windowsfor081-20&linkCode=sl1&language=en_US",
      features: [
        "STREAMLINED & INTUITIVE UI - Centered Start menu and effortless navigation",
        "SNAP LAYOUTS - Organize windows with pre-configured layouts that adapt to your screen",
        "CUSTOM DESKTOPS - Create separate desktops for each project and switch instantly",
        "VOICE TYPING - Turn ideas into text instantly with voice recognition",
        "CUSTOMIZABLE WIDGETS - Get live news, schedule, and to-do lists in a swipe",
        "WINDOWS HELLO - Biometric security with face or fingerprint recognition",
        "MICROSOFT TEAMS - Built-in collaboration tools",
        "XBOX GAME PASS - Integration with gaming services",
        "MICROSOFT STORE - Access to thousands of apps",
        "POWERFUL SECURITY - Hardware isolation, encryption, and malware protection built-in"
      ],
      limitations: [
        "OEM license tied to first PC - cannot transfer to another machine",
        "No direct Microsoft support included (community support available)",
        "Ships in plain envelope with activation key under scratch-off area"
      ],
      rating: 4.0,
      reviews: 2078,
      sku: "KW9-00633",
      asin: "B09MYJ1R6L"
    },
    pro: {
      name: "Microsoft Windows 11 Pro OEM",
      fullName: "Microsoft System Builder | Windows 11 Pro | OEM License",
      price: "$146.18",
      originalPrice: "$199.99",
      discount: "27% OFF",
      savings: "$53.81",
      format: "DVD FORMAT - Physical Media Included",
      mainImage: "/js/Win11Store/images/win11-pro-1.jpg",
      affiliateUrl: "https://www.amazon.com/dp/B09MYBD79G?tag=windowsfor081-20&linkCode=sl1&language=en_US",
      features: [
        "Everything in Windows 11 Home, PLUS:",
        "BITLOCKER ENCRYPTION - Full device encryption for data protection",
        "REMOTE DESKTOP - Connect to your PC from anywhere",
        "HYPER-V VIRTUALIZATION - Run virtual machines natively",
        "WINDOWS SANDBOX - Test software in isolated environment",
        "DOMAIN JOIN - Connect to corporate networks",
        "GROUP POLICY MANAGEMENT - Advanced system administration",
        "WINDOWS INFORMATION PROTECTION - Prevent data leaks",
        "ASSIGNED ACCESS - Create kiosk mode for single apps",
        "DYNAMIC PROVISIONING - Streamlined device setup for businesses",
        "WINDOWS UPDATE FOR BUSINESS - Control update deployment"
      ],
      limitations: [
        "OEM license tied to first PC - cannot transfer to another machine",
        "No direct Microsoft support included (community support available)",
        "Ships in plain envelope with activation key under scratch-off area"
      ],
      rating: 4.0,
      reviews: 2078,
      sku: "KW9-00664",
      asin: "B09MYBD79G"
    },
    m365: {
      name: "Microsoft 365 Personal",
      fullName: "Microsoft 365 Personal | 12-Month Subscription | Digital Download",
      price: "$99.99",
      originalPrice: "$99.99",
      discount: "",
      savings: "",
      format: "DIGITAL DOWNLOAD - Instant Delivery",
      mainImage: "/js/Win11Store/images/m365-1.jpg",
      affiliateUrl: "https://www.amazon.com/dp/B07F3TQ6DQ?tag=windowsfor081-20&linkCode=sl1&language=en_US",
      features: [
        "PREMIUM OFFICE APPS - Word, Excel, PowerPoint, Outlook, OneNote",
        "1TB ONEDRIVE CLOUD STORAGE - Secure cloud backup and file sync",
        "ADVANCED SECURITY - Ransomware protection and file recovery",
        "MICROSOFT EDITOR - Advanced spelling, grammar, and writing assistance",
        "PREMIUM OUTLOOK - Ad-free email with custom domain support",
        "MICROSOFT DEFENDER - Advanced protection across devices",
        "CLIPCHAMP VIDEO EDITOR - Professional video editing tools",
        "MICROSOFT TEAMS - Personal use for video calls and chat",
        "WORKS ON ALL DEVICES - Windows, Mac, iOS, Android (up to 5 devices)",
        "ALWAYS UP-TO-DATE - Latest features and security updates",
        "PHONE & CHAT SUPPORT - Direct Microsoft technical support included"
      ],
      limitations: [
        "Subscription-based - Requires annual renewal",
        "Internet connection required for activation and updates",
        "Single user license - For one person only"
      ],
      rating: 5.0,
      reviews: 11181,
      sku: "QQ2-01886",
      asin: "B0D6X5QY9V"
    }
  }

  const currentProduct = productVariants[activeTab]

  const trustBadges = [
    { icon: Shield, text: "Microsoft Authorized", color: "text-blue-600" },
    { icon: BadgeCheck, text: "Genuine OEM License", color: "text-green-600" },
    { icon: Disc, text: "Physical DVD Included", color: "text-purple-600" },
    { icon: Award, text: "Amazon's Choice", color: "text-yellow-600" }
  ]

  const systemRequirements = [
    { icon: Cpu, label: "Processor", value: "1 GHz or faster, 2+ cores, 64-bit compatible" },
    { icon: HardDrive, label: "RAM", value: "4 GB minimum (8 GB recommended)" },
    { icon: HardDrive, label: "Storage", value: "64 GB or larger storage device" },
    { icon: Monitor, label: "Display", value: "HD display (720p), 9\" or greater diagonal" },
    { label: "Graphics", value: "DirectX 12 compatible graphics / WDDM 2.x" },
    { label: "UEFI", value: "UEFI, Secure Boot capable" },
    { label: "TPM", value: "Trusted Platform Module (TPM) version 2.0" },
    { label: "Internet", value: "Internet connection for setup and updates" }
  ]


  const comparisonData = [
    { feature: "Windows 11 Operating System", home: true, pro: true, m365: false },
    { feature: "Office Apps (Word, Excel, PowerPoint)", home: false, pro: false, m365: true },
    { feature: "1TB OneDrive Cloud Storage", home: false, pro: false, m365: true },
    { feature: "Outlook Premium Email", home: false, pro: false, m365: true },
    { feature: "Microsoft Defender Advanced", home: false, pro: false, m365: true },
    { feature: "BitLocker Encryption", home: false, pro: true, m365: false },
    { feature: "Remote Desktop Host", home: false, pro: true, m365: false },
    { feature: "Hyper-V Virtualization", home: false, pro: true, m365: false },
    { feature: "Direct Microsoft Support", home: false, pro: false, m365: true },
    { feature: "Works on Multiple Devices", home: false, pro: false, m365: true },
    { feature: "Annual Updates Included", home: false, pro: false, m365: true },
    { feature: "One-time Purchase", home: true, pro: true, m365: false }
  ]

  const benefits = [
    {
      icon: Zap,
      title: "40% Faster Boot",
      description: "Optimized startup and app launches vs Windows 10"
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      description: "TPM 2.0, Secure Boot, and hardware isolation"
    },
    {
      icon: Layers,
      title: "Snap Layouts",
      description: "Intelligent window management for productivity"
    },
    {
      icon: MousePointer,
      title: "Multi-Input Support",
      description: "Voice, pen, touch, and traditional input"
    }
  ]

  const keyHighlights = [
    { icon: Monitor, text: "New intuitive interface with centered Start menu" },
    { icon: Mic, text: "Voice typing turns speech to text instantly" },
    { icon: PenTool, text: "Digital pen support for natural input" },
    { icon: Laptop, text: "Optimized for modern hardware and SSDs" },
    { icon: Server, text: "Pro: Business features for enterprise needs" }
  ]

  const homeProductImages = [
    {
      src: "/js/Win11Store/images/win11-home-1.jpg",
      alt: "Windows 11 Home OEM Box Front",
      caption: "Genuine Windows 11 Home OEM DVD"
    },
    {
      src: "/js/Win11Store/images/win11-home-2.jpg",
      alt: "Windows 11 Home Product Key",
      caption: "Official Product Key Card"
    },
    {
      src: "/js/Win11Store/images/win11-home-3.jpg",
      alt: "Windows 11 Home Box Back",
      caption: "System Requirements & Features"
    },
    {
      src: "/js/Win11Store/images/win11-home-4.jpg",
      alt: "Windows 11 Home Installation",
      caption: "Easy Installation Process"
    },
    {
      src: "/js/Win11Store/images/win11-home-5.jpg",
      alt: "Windows 11 Home DVD",
      caption: "Physical Installation Media"
    },
    {
      src: "/js/Win11Store/images/win11-home-6.jpg",
      alt: "Windows 11 Home Desktop",
      caption: "Clean Windows 11 Interface"
    }
  ]

  const proProductImages = [
    {
      src: "/js/Win11Store/images/win11-pro-1.jpg",
      alt: "Windows 11 Pro OEM Box",
      caption: "Genuine Windows 11 Pro OEM DVD"
    },
    {
      src: "/js/Win11Store/images/win11-pro-2.jpg",
      alt: "Windows 11 Pro Features",
      caption: "Business & Security Features"
    },
    {
      src: "/js/Win11Store/images/win11-pro-3.jpg",
      alt: "Windows 11 Pro Interface",
      caption: "Professional Desktop Experience"
    },
    {
      src: "/js/Win11Store/images/win11-pro-4.jpg",
      alt: "Windows 11 Pro Security",
      caption: "BitLocker & Advanced Security"
    },
    {
      src: "/js/Win11Store/images/win11-pro-5.jpg",
      alt: "Windows 11 Pro Package",
      caption: "Complete OEM Package"
    },
    {
      src: "/js/Win11Store/images/win11-pro-6.jpg",
      alt: "Windows 11 Pro Desktop",
      caption: "Professional Windows Experience"
    }
  ]

  const m365ProductImages = [
    {
      src: "/js/Win11Store/images/m365-1.jpg",
      alt: "Microsoft 365 Personal Box",
      caption: "Microsoft 365 Personal 12-Month"
    },
    {
      src: "/js/Win11Store/images/m365-2.jpg",
      alt: "Microsoft 365 Apps",
      caption: "Premium Office Applications"
    },
    {
      src: "/js/Win11Store/images/m365-3.jpg",
      alt: "Microsoft 365 Features",
      caption: "1TB Cloud Storage & Security"
    },
    {
      src: "/js/Win11Store/images/m365-4.jpg",
      alt: "Microsoft 365 Devices",
      caption: "Works on All Your Devices"
    },
    {
      src: "/js/Win11Store/images/m365-5.jpg",
      alt: "Microsoft 365 Collaboration",
      caption: "Teams & Collaboration Tools"
    },
    {
      src: "/js/Win11Store/images/m365-6.jpg",
      alt: "Microsoft 365 Benefits",
      caption: "Premium Features & Support"
    }
  ]

  const productImages = activeTab === 'home' ? homeProductImages : activeTab === 'pro' ? proProductImages : m365ProductImages

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">

      {/* Trust Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            {trustBadges.map((badge, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <badge.icon className={`w-5 h-5 ${badge.color}`} />
                <span className="font-semibold text-gray-700 dark:text-gray-300">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Main Product Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Product Image & Info */}
          <div className="relative">
            <div className="absolute -top-2 -left-2 z-10">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-4 py-2 rounded-full text-sm shadow-lg">
                SAVE {currentProduct.savings}
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {currentProduct.mainImage ? (
                <img
                  src={currentProduct.mainImage}
                  alt={currentProduct.name}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 p-8">
                  <div className="text-center text-white">
                    <div className="mb-4">
                      <Package className="w-24 h-24 mx-auto mb-4 text-white/90" />
                      <Disc className="w-16 h-16 mx-auto text-white/80" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{activeTab === 'm365' ? 'Microsoft 365 Personal' : `Windows 11 ${activeTab === 'pro' ? 'Pro' : 'Home'}`}</h2>
                    <p className="text-lg mb-4">OEM System Builder License</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                <div className="text-white">
                  <p className="text-sm mb-2">Product SKU: {currentProduct.sku}</p>
                  <p className="text-sm mb-2">ASIN: {currentProduct.asin}</p>
                  <p className="text-sm font-semibold mb-3">{currentProduct.format}</p>
                  <div className="flex items-center space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(currentProduct.rating) ? 'text-yellow-300 fill-yellow-300' : 'text-gray-400'}`}
                      />
                    ))}
                    <span className="text-white ml-2">({currentProduct.reviews.toLocaleString()} reviews)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Product Tabs */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setActiveTab('home')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                  activeTab === 'home'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Windows 11 Home
                <span className="block text-xs mt-1">Personal Use</span>
              </button>
              <button
                onClick={() => setActiveTab('pro')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all relative ${
                  activeTab === 'pro'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Windows 11 Pro
                <span className="block text-xs mt-1">Business Features</span>
              </button>
              <button
                onClick={() => setActiveTab('m365')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all relative ${
                  activeTab === 'm365'
                    ? 'bg-orange-600 text-white shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Microsoft 365
                <span className="block text-xs mt-1">Subscription</span>
                {activeTab !== 'm365' && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    Best Value
                  </span>
                )}
              </button>
            </div>

            {/* Key Highlights */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Key Highlights:</h4>
              <div className="space-y-2">
                {keyHighlights.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-sm">
                    <item.icon className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div>
            <div className="mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {currentProduct.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">{currentProduct.fullName}</p>
              <div className="flex items-center space-x-3">
                <BadgeCheck className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-600">Genuine Microsoft Product</span>
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-600">Amazon's Choice</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl mb-6">
              <div className="flex items-baseline space-x-3 mb-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{currentProduct.price}</span>
                {currentProduct.savings && (
                  <>
                    <span className="text-2xl text-gray-500 line-through">{currentProduct.originalPrice}</span>
                    <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {currentProduct.discount}
                    </span>
                  </>
                )}
              </div>
              {currentProduct.savings ? (
                <p className="text-green-600 font-semibold">
                  <Sparkles className="inline w-4 h-4 mr-1" />
                  You save {currentProduct.savings} with OEM pricing!
                </p>
              ) : (
                <p className="text-blue-600 font-semibold">
                  <Sparkles className="inline w-4 h-4 mr-1" />
                  Best value subscription - includes all Office apps!
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {activeTab === 'm365' ? 'Annual subscription with monthly payment option available' : 'Retail boxed version: $139-$199 at Microsoft Store'}
              </p>
            </div>

            {/* Key Features */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">What's Included:</h3>
              <div className="space-y-2">
                {currentProduct.features.slice(0, expandedFeatures ? undefined : 5).map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              {currentProduct.features.length > 5 && (
                <button
                  onClick={() => setExpandedFeatures(!expandedFeatures)}
                  className="text-blue-600 hover:text-blue-700 font-semibold mt-2 text-sm"
                >
                  {expandedFeatures ? 'Show less' : `+ ${currentProduct.features.length - 5} more features`}
                </button>
              )}
            </div>

            {/* Important OEM Limitations */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                Important OEM License Information:
              </h4>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {currentProduct.limitations.map((limit, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-yellow-600 mr-2">•</span>
                    <span>{limit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Call to Action */}
            <div className="space-y-4 mb-6">
              <a
                href={currentProduct.affiliateUrl}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="block w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 px-8 rounded-xl text-center text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <ShoppingCart className="inline w-5 h-5 mr-2" />
                Buy Now on Amazon{currentProduct.savings ? ` - Save ${currentProduct.savings}` : ''}
              </a>
              <p className="text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
                Paid link — WindowsForum may earn a commission if you buy through this link.
              </p>

              <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Disc className="w-4 h-4 mr-1" />
                  <span>Physical DVD</span>
                </div>
                <div className="flex items-center">
                  <Lock className="w-4 h-4 mr-1" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center">
                  <Package className="w-4 h-4 mr-1" />
                  <span>Fast Shipping</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-16 grid md:grid-cols-4 gap-6">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <benefit.icon className="w-10 h-10 text-blue-600 mb-3" />
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">{benefit.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Product Gallery */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Product Gallery
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            <Image className="inline w-5 h-5 mr-2" />
            Click images to view larger
          </p>
          <ImageGallery images={productImages} />
        </div>

        {/* System Requirements */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            System Requirements
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {systemRequirements.map((req, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  {req.icon && <req.icon className="w-5 h-5 text-blue-600 mt-1" />}
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">{req.label}:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">{req.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <AlertCircle className="inline w-4 h-4 mr-1" />
                Note: Windows 11 has stricter hardware requirements than Windows 10. Please verify TPM 2.0 and Secure Boot compatibility before purchasing.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Compare Our Products
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-4 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600 text-white">
              <div className="p-4 font-semibold">Features</div>
              <div className="p-4 text-center font-semibold">Windows 11 Home</div>
              <div className="p-4 text-center font-semibold">Windows 11 Pro</div>
              <div className="p-4 text-center font-semibold flex items-center justify-center">
                Microsoft 365
                <span className="ml-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded-full">SUBSCRIPTION</span>
              </div>
            </div>
            {comparisonData.map((row, idx) => (
              <div key={idx} className={`grid grid-cols-4 ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}>
                <div className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300">{row.feature}</div>
                <div className="p-4 text-center">
                  {row.home ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
                <div className="p-4 text-center">
                  {row.pro ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
                <div className="p-4 text-center">
                  {row.m365 ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* Final CTA */}
        <div className="mt-16 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-center text-white border border-gray-700">
          <h2 className="text-3xl font-bold mb-4">Ready to Upgrade to Windows 11?</h2>
          <p className="text-xl mb-2 text-gray-200">Get Your Genuine OEM License Today</p>
          <p className="text-sm mb-6 text-gray-400">Join millions who've upgraded to the future of Windows</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href={currentProduct.affiliateUrl}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center"
            >
              <Package className="w-5 h-5 mr-2" />
              Order {activeTab === 'm365' ? 'Microsoft 365' : 'Windows 11 OEM'} Now
              <ChevronRight className="w-5 h-5 ml-2" />
            </a>
            <div className="text-sm text-gray-300">
              <Lock className="inline w-4 h-4 mr-1" />
              Secure Amazon Checkout • Fast Shipping
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-gray-400">
            Paid link — WindowsForum may earn a commission if you buy through this link.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4 mt-16">
        <div className="container mx-auto text-center">
          <p className="text-sm text-gray-500">
            As an Amazon Associate I earn from qualifying purchases.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Windows is a registered trademark of Microsoft Corporation.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Product information based on Amazon ASIN: B09MYJ1R6L (Home) / B09MYBD79G (Pro)
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
