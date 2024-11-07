import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { MenuIcon } from 'lucide-react';
import {
  Home,
  Target,
  Calendar,
  Users,
  Settings,
  UserCircle,
  LogOut,
  Flame,
  ChevronRight
} from 'lucide-react';

interface FriendData {
  email?: string;
  goalsCompleted?: boolean;
  uid: string;
  profilePicture?: string;
  streak: number;
}

interface HeaderMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}
const HeaderMenu: React.FC<HeaderMenuProps> = ({ isOpen, setIsOpen }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [friendsFeed, setFriendsFeed] = useState<{ name: string; goalCompleted: boolean; uid: string; profilePicture: string; streak: number; }[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  const [isNewUser, setIsNewUser] = useState(false);
  const [showPointer, setShowPointer] = useState(false);

 
  useEffect(() => {
    const checkNewUser = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid, 'recommendations', 'daily');
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            
            setIsNewUser(false);
          
          } else {
            setIsNewUser(true);
            setTimeout(() => setShowPointer(true), 1000);
          }
        } catch (error) {
          console.error('Error checking new user status:', error);
        }
      }
    };

    checkNewUser();
  }, [user]);
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsOpen(!mobile); // Auto-open on desktop
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [user, setIsOpen]);
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfilePicture(data.profilePicture || null);
          }
        } catch (error) {
          console.error('Error fetching user profile picture:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const fetchFriendsFeed = async () => {
      if (user) {
        try {
          const friendsQuery1 = query(
            collection(db, 'friend_requests'),
            where('status', '==', 'accepted'),
            where('from', '==', user.uid)
          );

          const friendsQuery2 = query(
            collection(db, 'friend_requests'),
            where('status', '==', 'accepted'),
            where('to', '==', user.uid)
          );

          const [querySnapshot1, querySnapshot2] = await Promise.all([
            getDocs(friendsQuery1),
            getDocs(friendsQuery2)
          ]);

          const friendsData = await Promise.all([
            ...querySnapshot1.docs,
            ...querySnapshot2.docs
          ].map(async (docSnap) => {
            const friendId = docSnap.data().from === user.uid ? docSnap.data().to : docSnap.data().from;
            const friendDoc = doc(db, 'users', friendId);
            const friendSnapshot = await getDoc(friendDoc);

            const friendData = friendSnapshot.data() as FriendData;

            return {
              name: friendData?.email || 'Friend',
              goalCompleted: friendData?.goalsCompleted || false,
              uid: friendData?.uid,
              profilePicture: friendData?.profilePicture || '/default-profile.png',
              streak : friendData?.streak || 0
            };
          }));

          setFriendsFeed(friendsData);
        } catch (error) {
          console.error('Error fetching friends feed:', error);
        }
      }
    };

    fetchFriendsFeed();
  }, [user]);

  


  const menuItems = [
    { 
      icon: Home, 
      text: 'Dashboard', 
      path: '/',
      description: 'Overview of your progress'
    },
    { 
      icon: Target, 
      text: 'Goals', 
      path: '/goals',
      description: 'Set and track your goals'
    },
    { 
      icon: Calendar, 
      text: 'Meal Planning', 
      path: '/meals-plan',
      description: 'Plan and schedule meals'
    },
    { 
      icon: Users, 
      text: 'Community', 
      path: '/add-friends',
      description: 'Connect with friends'
    },
    { 
      icon: UserCircle, 
      text: 'Profile', 
      path: '/customize-profile',
      description: 'Customize your profile'
    },
    { 
      icon: Settings, 
      text: 'Settings', 
      path: '/settings',
      description: 'Manage your preferences'
    }
  ];

  const navigateTo = (path: string) => {
    if (path === '/goals') setShowPointer(false);
    router.push(path);
    if (isMobile) setIsOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background">
      {/* Profile Section */}
      <div className="px-6 py-6 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarImage src={profilePicture || undefined} alt="Profile" />
            <AvatarFallback className="bg-primary/10">
              {user?.displayName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-base">
              {user?.displayName || 'User'}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-6">
        <nav className="px-4 space-y-1">
          {menuItems.map((item) => (
            <TooltipProvider key={item.path}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigateTo(item.path)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-sm
                      group relative transition-colors
                      hover:bg-primary/10 hover:text-primary
                      ${pathname === item.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}
                    `}
                  >
                    <item.icon className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
                    <span className="flex-1 font-medium">{item.text}</span>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </nav>

        {/* Friends Activity */}
        <div className="mt-6 px-4">
          <h4 className="text-sm font-semibold px-3 mb-3 text-muted-foreground">
            Friends Activity
          </h4>
          <div className="space-y-1">
            {friendsFeed.map((friend) => (
              <div
                key={friend.uid}
                className="flex items-center p-3 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={friend.profilePicture} alt={friend.name} />
                  <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{friend.name}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      friend.goalCompleted ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <p className="text-xs text-muted-foreground">
                      {friend.goalCompleted ? 'Completed' : 'In progress'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-2 flex items-center space-x-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span>{friend.streak}</span>
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Sign Out Button */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 group"
          onClick={signOutUser}
        >
          <LogOut className="h-5 w-5 mr-3 transition-transform group-hover:rotate-12" />
          <span className="font-medium">Sign Out</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 lg:hidden hover:bg-primary/10"
          onClick={() => setIsOpen(true)}
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
      )}

      {/* Sidebar Container */}
      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="p-0 w-80">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      ) : (
        <div className={`fixed inset-y-0 left-0 w-80 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
          transform transition-transform duration-300 ease-in-out shadow-lg
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent />
        </div>
      )}
    </>
  );
};

export default HeaderMenu;
